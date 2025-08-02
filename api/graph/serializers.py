from rest_framework import serializers

from . import models


class NodeSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    label = serializers.CharField()
    instance_of = serializers.CharField(required=False)
    group = serializers.IntegerField(required=False)
    distance_to_center = serializers.IntegerField(required=False, allow_null=True)
    radius = serializers.IntegerField(required=False, allow_null=True)
    colour = serializers.CharField(required=False, allow_null=True)

    def get_id(self, obj):
        return obj.wd_id


class EdgeSerializer(serializers.Serializer):
    source = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()
    type = serializers.CharField(required=False)

    def get_source(self, obj):
        return obj.source.wd_id

    def get_target(self, obj):
        return obj.target.wd_id


class GraphSerializer(serializers.Serializer):
    nodes = NodeSerializer(many=True)
    edges = EdgeSerializer(many=True)
    updated_at = serializers.DateTimeField(read_only=True)
    country = serializers.PrimaryKeyRelatedField(
        required=False, allow_null=True, read_only=True
    )
    from_accomplice = serializers.PrimaryKeyRelatedField(
        required=False, allow_null=True, read_only=True
    )

    # to do : is this really needed ?
    class Meta:
        model = models.Graph
        fields = ["nodes", "edges", "updated_at", "country", "from_accomplice"]
        read_only_fields = []
