from rest_framework import serializers
from . import models
from django.db.utils import IntegrityError


class WikidataField(serializers.Field):
    type = serializers.CharField()
    value = serializers.CharField()

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError(
                "Expected a dictionary with 'type' and 'value'"
            )

        if "value" not in data:
            raise serializers.ValidationError("Missing 'value' in WikidataField")

        return data["value"]

    def to_representation(self, value):
        return {
            "type": "uri",
            "value": value,
        }


class WikiDataSparqlBaseSerializer(serializers.Serializer):
    item = WikidataField()
    itemLabel = WikidataField()
    instanceOf = WikidataField()
    instanceOfLabel = WikidataField(required=False)
    subclassOf = WikidataField(required=False)
    subclassOfLabel = WikidataField(required=False)
    linkTo = WikidataField()
    linkToLabel = WikidataField()
    typeOfLink = WikidataField()

    def create(self, validated_data):
        # accomplice
        if self.context.get("base", False):
            defaults = {
                "id": validated_data["item"].split("/")[-1],
                "label": validated_data["itemLabel"],
                "distance_to_center": 0 if self.context.get("base", False) else None,
                "base": True,
                "group": 1,  # Default group for base accomplice
            }
        else:
            defaults = {
                "id": validated_data["item"].split("/")[-1],
                "label": validated_data["itemLabel"],
                "distance_to_center": 0 if self.context.get("base", False) else None,
                "group": 2,
            }
        accomplice, created = models.Accomplice.objects.update_or_create(
            id=defaults["id"], defaults=defaults
        )

        # instanceof
        if url := validated_data.get(
            "instanceOf", validated_data.get("subclassOf", False)
        ):
            defaults = {
                "id": url.split("/")[-1],
                "label": validated_data.get(
                    "instanceOfLabel", validated_data.get("subclassOfLabel")
                ),
            }
            instance_of, created = models.InstanceOf.objects.update_or_create(
                id=defaults["id"], defaults=defaults
            )
            accomplice.instance_of.add(instance_of)
        else:
            print(
                f"Either 'instanceOf' or 'subclassOf' should be provided ? {validated_data}"
            )
        # linkto
        if not self.context.get("base", False):
            print(f" WikiDataSparqlBaseSerializer linkto {validated_data}")
            defaults = {
                "id": validated_data["linkTo"].split("/")[-1],
                "label": validated_data["linkToLabel"],
            }
            link_to, created = models.Accomplice.objects.update_or_create(
                id=defaults["id"], defaults=defaults
            )

            try:
                models.GraphEdge(
                    source=accomplice,
                    target=link_to,
                    type_of_link=validated_data["typeOfLink"],
                ).save()
            except IntegrityError:
                # probably already exists
                pass

        return accomplice

    def validate(self, validated_data):
        validated_data = super().validate(validated_data)
        if not validated_data.get("instanceOf", False) and not validated_data.get(
            "subclassOf", False
        ):
            print(
                f"Either 'instanceOf' or 'subclassOf' should be provided ? {validated_data}"
            )
        return super().validate(validated_data)


class GraphEdgeSerializer(serializers.Serializer):
    accomplice = serializers.ModelField(models.Accomplice)
    link_to = serializers.ModelField(models.Accomplice)
    type_of_relation = serializers.CharField(max_length=25, required=True)
    distance_to_center = serializers.IntegerField(required=True)
