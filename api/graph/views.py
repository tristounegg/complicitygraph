# api/v1/graph?group=1&country=fr
# api/v1/graph?group=1&from_accomplice=franck

import json
import logging
from datetime import timedelta

from django.conf import settings
from django.http import HttpResponse
from django.utils.timezone import now
from rest_framework import viewsets
from rest_framework.response import Response

from . import filters, models, serializers, tasks

logger = logging.getLogger(__name__)


class GraphViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.GraphSerializer
    filterset_class = filters.GraphFilter
    queryset = models.Graph.objects.all()

    def list(self, request, *args, **kwargs):
        filtered_graphs = self.filter_queryset(self.get_queryset())
        # to do : reload api if .env is update
        freshness_window = timedelta(seconds=settings.GRAPH_REFRESH_DELAY)
        graph = None
        if filtered_graphs.exists():
            latest_graph = filtered_graphs.first()
            if latest_graph.updated_at > now() - freshness_window:
                serializer = self.get_serializer(latest_graph)
                logger.info(
                    f"Returning cached graph {latest_graph.id} from {latest_graph.updated_at} \
                settings.GRAPH_REFRESH_DELAY: {settings.GRAPH_REFRESH_DELAY} seconds"
                )
                return Response(serializer.data)
            else:
                graph = latest_graph
        # Build graph if no fresh one found
        filter_instance = self.filterset_class(
            request.GET, queryset=models.Graph.objects.none()
        )
        filter_instance.form.is_valid()
        params = filter_instance.form.cleaned_data
        from_accomplice = params["from_accomplice"]
        country = params["country"]
        if params["from_accomplice"] == "None" or params["country"] == "None":
            from_accomplice = None
            country = None
        json_graph = tasks.build_graph(
            graph, from_accomplice=from_accomplice, country=country
        )
        return HttpResponse(
            content=json.dumps(json_graph), content_type="application/json"
        )
