from django.http import HttpResponse

from . import wikidata


def upgrade(request):
    data = wikidata.upgrade_accomplices()
    return HttpResponse(data)


def base(request):
    data = wikidata.fetch_base_accomplices()
    return HttpResponse(data)


def ceo(request):
    data = wikidata.fetch_ceo_accomplices()
    return HttpResponse(data)


def iteration(request):
    data = wikidata.fetch_indirect_accomplices()
    return HttpResponse(data)
