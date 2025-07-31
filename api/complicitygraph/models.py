from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
 from . import wikidata

class InstanceOf(models.Model):
    label = models.CharField(max_length=255, blank=True, null=True)
    id = models.CharField(max_length=255, primary_key=True)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, blank=True, null=True
    )
    object_id = models.CharField(blank=True, null=True)
    content_object = GenericForeignKey("content_type", "object_id")


class Accomplice(models.Model):
    instance_of = GenericRelation(InstanceOf, related_query_name="accomplices")
    id = models.CharField(max_length=255, primary_key=True)
    label = models.CharField(max_length=255, blank=True, null=True)
    base = models.BooleanField(default=False)
    distance_to_center = models.IntegerField(blank=True, null=True)
    # used by PIXI.Container on the frontend
    group = models.IntegerField(blank=True, null=True)


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


class GraphEdge(models.Model):
    source = models.ForeignKey(
        Accomplice, on_delete=models.CASCADE, related_name="graphs"
    )
    target = models.ForeignKey(Accomplice, on_delete=models.CASCADE)
    type_of_link = models.CharField(choices=TYPE_CHOICES, default="", max_length=25)

    class Meta:
        unique_together = (("source", "target", "type_of_link"),)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            wikidata.do_something_async.delay(self.id)
