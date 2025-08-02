from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models


class InstanceOf(models.Model):
    label = models.CharField(max_length=255, blank=True, null=True)
    id = models.CharField(max_length=255, primary_key=True)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, blank=True, null=True
    )
    object_id = models.CharField(blank=True, null=True)
    content_object = GenericForeignKey("content_type", "object_id")


class Country(models.Model):
    name = models.CharField(max_length=255, unique=True)


class Accomplice(models.Model):
    instance_of = GenericRelation(InstanceOf, related_query_name="accomplices")
    id = models.CharField(max_length=255, primary_key=True)
    label = models.CharField(max_length=255, blank=True, null=True)
    base = models.BooleanField(default=False)
    link_count = models.IntegerField(default=0, blank=True, null=True)
    # used by PIXI.Container on the frontend
    group = models.IntegerField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)


TYPE_CHOICES = [
    ("ownedBy", "ownedBy"),
    ("ownerOf", "ownerOf"),
    ("childOrgOf", "childOrgOf"),
    ("parentOrg", "parentOrg"),
    ("partOf", "partOf"),
    ("hasCEO", "hasCEO"),
    ("hasDirector", "hasDirector"),
    ("hasChairPerson", "hasChairPerson"),
    ("hasBoardMember", "hasBoardMember"),
]


class WikidataEdge(models.Model):
    source = models.ForeignKey(
        Accomplice, on_delete=models.CASCADE, related_name="wikidata_edges"
    )
    target = models.ForeignKey(Accomplice, on_delete=models.CASCADE)
    type_of_link = models.CharField(choices=TYPE_CHOICES, default="", max_length=25)

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, blank=True, null=True
    )
    object_id = models.CharField(blank=True, null=True)
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        unique_together = (("source", "target", "type_of_link"),)
