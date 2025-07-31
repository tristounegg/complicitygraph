import requests
import logging
import re
from urllib.parse import quote
from . import models, serializers
from rest_framework.exceptions import ValidationError
from django.db.models import Q
import networkx as nx
import json

logger = logging.getLogger(__name__)


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
    with open("complicitygraph/sparql/Base.rq", "r", encoding="utf-8") as file:
        sparql = file.read()
    encoded_query = quote(sparql)
    data = fetch_wiki_data_post(encoded_query)
    print(f"Fetched this from wikidata {data}")
    serializer = serializers.WikiDataSparqlBaseSerializer(
        data=data["results"]["bindings"], many=True, context={"base": True}
    )
    serializer.is_valid(raise_exception=True)
    return serializer.save()


def fetch_indirect_accomplices():
    print("Fetching indirect accomplices")
    with open("complicitygraph/sparql/Iteration.rq", "r", encoding="utf-8") as file:
        sparql = file.read()
    rootNodes = models.Accomplice.objects.filter(base=True)
    rootNodesWDids = [("wd:" + i.id) for i in rootNodes]
    sparql = sparql.replace("SVAR:SUBPERPETRATOR", " ".join(rootNodesWDids))
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
    def chunk_list(lst, size):
        """Yield successive chunks from a list."""
        for i in range(0, len(lst), size):
            yield lst[i : i + size]

    with open("complicitygraph/sparql/CEO.rq", "r", encoding="utf-8") as file:
        sparql = file.read()
    nodes = models.Accomplice.objects.filter(~Q(instance_of__label="human"))
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


def upgrade_accomplices():
    fetch_base_accomplices()
    # this two can run asynchronously
    fetch_ceo_accomplices()
    fetch_indirect_accomplices()
    # sync needed
    fetch_indirect_accomplices()
