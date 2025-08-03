from django.http import HttpResponse
from rest_framework import viewsets

from . import models, serializers, tasks


def upgrade(request):
    data = tasks.upgrade_accomplices()
    return HttpResponse(data)


def base(request):
    data = tasks.fetch_base_accomplices()
    return HttpResponse(data)


def ceo(request):
    data = tasks.fetch_ceo_accomplices()
    return HttpResponse(data)


def iteration(request):
    data = tasks.fetch_indirect_accomplices()
    return HttpResponse(data)


class CountryViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.CountrySerializer
    queryset = models.Country.objects.all().order_by("label")


class AccompliceViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.AccompliceSerializer
    queryset = models.Accomplice.objects.all().order_by("label")


def accomplice_list(request):
    accomplices = models.Accomplice.objects.all().values("d", "label")
    return HttpResponse([{"id": a["id"], "label": a["label"]} for a in accomplices])
