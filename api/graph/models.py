from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from wikidata.models import Accomplice, Country


class Graph(models.Model):
    """
    This model is used to store the graph data.
    """

    # used to get special graphs ("full" is a graph with all accomplices)
    name = models.CharField(max_length=255, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        related_name="graphs",
        blank=True,
        null=True,
    )
    from_accomplice = models.ForeignKey(
        Accomplice,
        on_delete=models.CASCADE,
        related_name="graphs",
        blank=True,
        null=True,
    )

    def __str__(self):
        return f"Graph with {self.edges.count()} edges"

    class Meta:
        unique_together = ["country", "from_accomplice"]


class Node(models.Model):
    # This is the ID of the node, the same as Accomplice.id
    wd_id = models.CharField(max_length=255)
    label = models.CharField(max_length=255, blank=True, null=True)
    # This is the instanceOf label, if any. We take the first one of Accomplice.instance_of
    instance_of = models.CharField(max_length=255, blank=True, null=True)
    distance_to_center = models.IntegerField(default=0)
    link_count = models.IntegerField(default=0)
    radius = models.IntegerField()
    colour = models.CharField(max_length=7)
    group = models.IntegerField()

    graph = models.ForeignKey(
        Graph,
        on_delete=models.CASCADE,
        related_name="nodes",
        blank=True,
        null=True,
    )

    # GenericRelation
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    object_id = models.PositiveIntegerField(
        blank=True,
        null=True,
    )
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        unique_together = ["wd_id", "graph"]


class Edge(models.Model):
    source = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name="source_edges",
    )
    target = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name="target_edges",
    )
    type = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    graph = models.ForeignKey(
        Graph,
        on_delete=models.CASCADE,
        related_name="edges",
        blank=True,
        null=True,
    )

    class Meta:
        unique_together = ["source", "target", "graph", "type"]
