from django.http import HttpResponse
from . import models, wikidata, network
from django.db.models import Max
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
    max_distance = data.aggregate(Max("source__distance_to_center"))[
        "source__distance_to_center__max"
    ]
    for graphedge in data:
        for node in [graphedge.source, graphedge.target]:
            G.add_node(
                node.id,
                label=node.label,
                instanceOf=(
                    node.instance_of.first().label
                    if node.instance_of.exists()
                    else None
                ),
                radius=(node.link_count * 2 if node.link_count != 0 else 5),
                colour=network.get_color_from_distance_to_center(
                    node.distance_to_center / max_distance
                ),
                group=node.group,
            )

        G.add_edge(
            graphedge.source.id, graphedge.target.id, typeOfLink=graphedge.type_of_link
        )

    # re calculate distances
    # to do : radius should be after
    target_nodes = [n.target.id for n in data if n.target.base is True]
    lengths = nx.multi_source_dijkstra_path_length(G, target_nodes)
    for node, dist in lengths.items():
        node = models.Accomplice.objects.get(id=node)
        node.distance_to_center = dist
        node.save()

    link_counts = network.compute_all_connected_counts_nx(G, target_nodes)
    for node_id, count in link_counts.items():
        node = models.Accomplice.objects.get(id=node_id)
        node.link_count = count
        node.save()
    json_graph = nx.node_link_data(G, edges="edges")
    return HttpResponse(content=json.dumps(json_graph), content_type="application/json")
