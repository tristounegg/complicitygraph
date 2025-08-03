import logging
import re
from datetime import timedelta
from urllib.parse import quote

import requests
from django.conf import settings
from django.db.models import Q
from django.utils.timezone import now
from taskapp import celery

from . import models, serializers

logger = logging.getLogger(__name__)


def chunk_list(lst, size):
    """Yield successive chunks from a list."""
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


def fetch_wiki_data_post(query):
    endpoint = "https://query.wikidata.org/sparql"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/sparql-results+json",
    }
    data = f"query={query}"

    response = requests.post(endpoint, headers=headers, data=data)

    if not response.ok:
        raise Exception(f"HTTP error {response.__dict__}")

    return response.json()


def fetch_base_accomplices():
    with open("wikidata/sparql/Base.rq", encoding="utf-8") as file:
        sparql = file.read()
    encoded_query = quote(sparql)
    data = fetch_wiki_data_post(encoded_query)
    # logger.info(f"Fetched this from wikidata {data}")
    serializer = serializers.WikiDataSparqlBaseSerializer(
        data=data["results"]["bindings"], many=True, context={"base": True}
    )
    serializer.is_valid(raise_exception=True)
    return serializer.save()


def fetch_indirect_accomplices():
    logger.info("Fetching indirect accomplices")
    with open("wikidata/sparql/Iteration.rq", encoding="utf-8") as file:
        sparql = file.read()

    rootNodes = models.Accomplice.objects.filter()
    rootNodesWDids = [("wd:" + i.id) for i in rootNodes]
    for chunk in chunk_list(rootNodesWDids, 500):
        sparql = sparql.replace("SVAR:SUBPERPETRATOR", " ".join(chunk))
        sparql = re.sub(r"#.*", "", sparql)
        encoded_query = quote(sparql)
        data = fetch_wiki_data_post(encoded_query)
        serializer = serializers.WikiDataSparqlBaseSerializer(
            data=data["results"]["bindings"], many=True
        )
        serializer.is_valid(raise_exception=True)
        items = serializer.save()
    return items


def fetch_ceo_accomplices():
    with open("wikidata/sparql/CEO.rq", encoding="utf-8") as file:
        sparql = file.read()

    threshold_time = now() - timedelta(seconds=settings.WIKIDATA_REFRESH_DELAY)
    nodes = models.Accomplice.objects.filter(~Q(instance_of__label="human")).filter(
        updated_at__lt=threshold_time
    )
    rootNodesWDids = [("wd:" + i.id) for i in nodes]
    all_bindings = []

    for chunk in chunk_list(rootNodesWDids, 500):
        sparql = sparql.replace("JSVAR:ORGID", " ".join(chunk))
        sparql = re.sub(r"#.*", "", sparql)
        encoded_query = quote(sparql)
        data = fetch_wiki_data_post(encoded_query)
        bindings = data.get("results", {}).get("bindings", [])
        all_bindings.extend(bindings)

    serializer = serializers.WikiDataSparqlBaseSerializer(data=all_bindings, many=True)
    serializer.is_valid(raise_exception=True)
    return serializer.save()


@celery.app.task(name="wikidata.upgrade_accomplices")
def upgrade_accomplices():
    fetch_base_accomplices()
    # this two can run asynchronously
    fetch_ceo_accomplices()
    fetch_indirect_accomplices()

    # sync needed
