import logging

import matplotlib.colors as mcolors
import networkx as nx
from django.db.models import Q
from django.utils.timezone import now
from wikidata import models as wikidata_models

from . import models

logger = logging.getLogger(__name__)


def compute_all_connected_counts_nx(G, root_nodes):
    link_counts = {}
    global_max = 0

    for component in nx.connected_components(G):
        subgraph = G.subgraph(component)
        component_nodes = list(subgraph.nodes)

        # Nodes with degree 1 and not candidate roots
        leaves = [
            n
            for n in component_nodes
            if subgraph.degree[n] == 1 and n not in root_nodes
        ]

        distances = {}
        visited = set()

        # BFS from leaves
        queue = [(leaf, 0) for leaf in leaves]
        while queue:
            current, dist = queue.pop(0)
            if current in visited:
                continue
            visited.add(current)
            if current not in distances or dist > distances[current]:
                distances[current] = dist
            for neighbor in subgraph.neighbors(current):
                queue.append((neighbor, dist + 1))

        # Set root distance to local max + 1
        local_max = max(distances.values(), default=0)
        for node in component_nodes:
            if node in root_nodes:
                distances[node] = local_max + 1

        # Normalize based on global max
        component_max = max(distances.values(), default=0)
        if component_max > global_max:
            global_max = component_max

        for node, val in distances.items():
            link_counts[node] = val

    # Normalize all distances
    for node in link_counts:
        link_counts[node] = round(
            link_counts[node] * (1.0 * global_max / max(link_counts[node], 1))
        )

    return link_counts


def get_color_from_distance_to_center(ratio):
    t = max(0.1, min(0.99, ratio))
    color_start = "#D01B1B"  # red
    color_end = "#2930F8"  # blue

    cmap = mcolors.LinearSegmentedColormap.from_list("custom", [color_start, color_end])
    r, g, b, _ = cmap(t)

    r_int = int(r * 255)
    g_int = int(g * 255)
    b_int = int(b * 255)

    rgb_int = (r_int << 16) | (g_int << 8) | b_int
    return hex(rgb_int)


def calculate_node_distance_from_root(graph, target_nodes, db_nodes):
    lengths = nx.multi_source_dijkstra_path_length(graph, target_nodes)
    nodes = []
    for node, dist in lengths.items():
        node = next((n for n in db_nodes if n.wd_id == node), None)
        node.distance_to_center = dist
        node.save()
        nodes.append(node)
    return nodes


def calculate_networksize_for_each_node(graph, target_nodes, db_nodes):
    try:
        link_scores = nx.eigenvector_centrality(graph)
    except nx.NetworkXException as e:
        logger.info(f"Eigenvector centrality computation failed: {e}")
        return

    if not link_scores:
        return

    min_score = min(link_scores.values())
    max_score = max(link_scores.values())
    score_range = max_score - min_score if max_score != min_score else 1

    def normalize(score):
        return 1 + ((score - min_score) / score_range) * 14

    db_node_dict = {n.wd_id: n for n in db_nodes}

    for node_id, score in link_scores.items():
        node = db_node_dict.get(node_id)
        if node:
            normalized_score = normalize(score)
            node.link_count = normalized_score
            node.save()


def create_graph_object(group=None, country=None, from_accomplice=None):
    logger.info(f"from_accomplice: {from_accomplice}, country: {country}")
    accomplice = (
        models.Accomplice.objects.get(id=from_accomplice)
        if from_accomplice or from_accomplice is not None
        else None
    )
    country = (
        models.Country.objects.filter(name=country).first()
        if country or country is not None
        else None
    )
    graph = models.Graph.objects.create(
        from_accomplice=accomplice,
        country=country,
    )
    return graph


def get_filtered_edges(group=None, country=None, from_accomplice=None):
    qs = wikidata_models.WikidataEdge.objects.select_related("source", "target")

    if group:
        qs = qs.filter(Q(source__group=group) | Q(target__group=group))
    if country:
        qs = qs.filter(
            Q(source__country__code=country) | Q(target__country__code=country)
        )

    if from_accomplice:
        # to do : Build graph in memory not optimized, we should used cached graph ?
        #  or graph db ?
        G = nx.Graph()
        for edge in qs:
            G.add_edge(edge.source.id, edge.target.id)

        # Traverse from the given accomplice ID
        if from_accomplice in G:
            connected_nodes = nx.node_connected_component(G, from_accomplice)
        else:
            connected_nodes = set()

        # Filter queryset again to only include edges with source/target in connected_nodes
        qs = qs.filter(
            Q(source__id__in=connected_nodes) | Q(target__id__in=connected_nodes)
        )
    if not qs.exists():
        raise ValueError("No edges found for the given parameters.")
    return qs


def create_node_and_edges_objects(edges_qs, graph):
    logger.info("Creating nodes and edges objects...")
    nodes_data = []
    edges_data = []
    for edge in edges_qs:
        for node in [edge.source, edge.target]:
            nodes_data.append(
                (
                    node.id,
                    {
                        "label": node.label,
                        "instanceOf": (
                            node.instance_of.all()[0].label
                            if len(node.instance_of.all()) > 0
                            else None
                        ),
                        "group": node.group,
                    },
                )
            )
        edges_data.append(
            (
                edge.source.id,
                edge.target.id,
                {
                    "link": edge.type_of_link,
                },
            )
        )
    db_nodes = []
    for node in nodes_data:
        accomplice = wikidata_models.Accomplice.objects.get(id=node[0])
        defaults = {
            "colour": 000000,
            "radius": 2,
        }
        db_node, created = models.Node.objects.update_or_create(
            wd_id=node[0],
            label=node[1]["label"],
            instance_of=(
                accomplice.instance_of.all().first().label
                if accomplice.instance_of.count() > 0
                else None
            ),
            group=node[1]["group"],
            graph=graph,
            defaults=defaults,
        )
        db_nodes.append(db_node)

    for edge in edges_data:
        source_node = models.Node.objects.get(wd_id=edge[0], graph=graph)
        target_node = models.Node.objects.get(wd_id=edge[1], graph=graph)
        models.Edge.objects.update_or_create(
            source=source_node,
            target=target_node,
            type=edge[2]["link"],
            graph=graph,
        )

    return (
        db_nodes,
        nodes_data,
        edges_data,
    )


def calculate_nodes_attributes(
    db_nodes, nodes_data, edges_data, graph, from_accomplice
):
    logger.info("Calculating nodes attributes...")
    # calculate radius and linkcount for nodes within the graph
    G = nx.Graph()
    G.add_nodes_from(nodes_data)
    G.add_edges_from(edges_data)
    target_nodes = [
        n[0]
        for n in nodes_data
        if wikidata_models.Accomplice.objects.get(id=n[0]).base is True
    ]
    if from_accomplice is None:
        target_nodes.extend(
            wikidata_models.Accomplice.objects.filter(base=True).values_list(
                "id", flat=True
            )
        )
    else:
        target_nodes.append(from_accomplice)
    calculate_networksize_for_each_node(G, target_nodes, db_nodes)
    nodes = calculate_node_distance_from_root(G, target_nodes, db_nodes)
    # Update nodes with radius and color based on distance to center
    max_distance = max(node.distance_to_center for node in nodes)

    for n in nodes_data:
        node = models.Node.objects.get(wd_id=n[0], graph=graph)
        node.radius = node.link_count
        node.colour = get_color_from_distance_to_center(
            node.distance_to_center / max_distance
        )
        logger.info(
            f"Node {node.label} - Distance: {node.distance_to_center}, "
            f"Radius: {node.radius}, Colour: {node.colour}"
        )
        node.save()
        n[1]["radius"] = node.radius
        n[1]["colour"] = node.colour

    return nodes_data


def build_graph(graph=None, group=None, country=None, from_accomplice=None):
    logger.info(f"Buildign graph with : {group} {country} {from_accomplice}")
    if graph is None:
        graph = create_graph_object(
            group=group, country=country, from_accomplice=from_accomplice
        )
    edges_qs = get_filtered_edges(
        group=group, country=country, from_accomplice=from_accomplice
    )
    db_nodes, nodes_data, edges_data = create_node_and_edges_objects(edges_qs, graph)
    calculate_nodes_attributes(db_nodes, nodes_data, edges_data, graph, from_accomplice)
    Gupdated = nx.Graph()
    Gupdated.add_nodes_from(nodes_data)
    Gupdated.add_edges_from(edges_data)
    graph.updated_at = now()
    graph.save()

    json_graph = nx.node_link_data(Gupdated, edges="edges")

    return json_graph
