from django.http import HttpResponse
from . import models, wikidata

import networkx as nx
import json


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


def graph(request):
    data = models.GraphEdge.objects.select_related("source", "target").all()

    # build graph
    G = nx.Graph()
    for graphedge in data:
        source = graphedge.source
        target = graphedge.target

        G.add_node(
            source.id,
            label=source.label,
            instanceOf=(
                source.instance_of.first().label
                if source.instance_of.exists()
                else None
            ),
            distances=source.distance_to_center,
            group=source.group,
        )
        G.add_node(
            target.id,
            label=target.label,
            instanceOf=(
                source.instance_of.first().label
                if source.instance_of.exists()
                else None
            ),
            distances=source.distance_to_center,
            group=target.group,
        )

        G.add_edge(source.id, target.id, typeOfLink=graphedge.type_of_link)

    # calculate distances
    target_nodes = [n for n in data if n.target.distance == 0]
    lengths = nx.multi_source_dijkstra_path_length(G, target_nodes)
    for node, dist in lengths.items():
        node = models.Accomplice.objects.get(id=node.id)
        node.distance_to_center = dist
        node.save()

    json_graph = nx.node_link_data(G, edges="edges")
    return HttpResponse(content=json.dumps(json_graph), content_type="application/json")
