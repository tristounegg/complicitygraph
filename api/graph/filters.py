import django_filters

from . import models


class GraphFilter(django_filters.FilterSet):
    group = django_filters.NumberFilter(field_name="nodes__group")
    country = django_filters.CharFilter(
        field_name="country__label", lookup_expr="iexact"
    )
    from_accomplice = django_filters.CharFilter(method="filter_from_accomplice")

    class Meta:
        model = models.Graph
        fields = ["group", "country", "from_accomplice"]

    def filter_from_accomplice(self, queryset, name, value):
        if value.lower() == "none":
            return queryset.filter(from_accomplice__isnull=True)
        return queryset.filter(from_accomplice__id__iexact=value)
