// messages:
let loadinginfo = d3.select("#loadinginfo");
let loadingGraph = d3.select("#loadingGraph");
let constructingGraph = d3.select("#constructingGraph");
let updatingGraph = d3.select("#updatingGraph");
let loadinginfotext = "";
// necessary globals
let graph, graphstore, canvas ;

async function getOrCreateCachedGraph(useCache=true) {
    const cacheKey = `graph`;
    const cached = localStorage.getItem(cacheKey);

    // if (cached && useCache) {
    //     console.log("Loaded graph from cache");
    //     const graph  = JSON.parse(cached);
    //     return graph;
    // }

    graph = await getGraphData();
    localStorage.setItem(cacheKey, JSON.stringify({
        graph: graph,
    }));
    console.log("Graph saved to cache");
    return graph;
}

// INITIALISATION
document.getElementById("upgradeGraphButton").disabled = true;
async function initGraph() {
    ( graph = await getOrCreateCachedGraph());
    graph = drawGraph(graph);
    getInstitutionList(graph.nodes);
}

initGraph();

async function buildItemList(nodes, listName) {
    let div = d3.select(`#${listName}selector`);
    div.append("h3").text(listName);
    nodes.forEach(c=>{
        let newdiv = div.append("div")
        let cval = c.id.replace("wd:", "http://www.wikidata.org/entity/");
        let cid = cval.replace("http://www.wikidata.org/entity/","c")
        newdiv
            .append("input")
            .attr("type", "checkbox")
            .attr("name", c["label"])
            .attr("id", cval)
            .attr("value", cval)
            .on("change", function () {
                const isChecked = this.checked;
                const value = this.value;
                const liveNode = graph.nodes.find(n =>
                    value.endsWith(n.id.replace("wd:", ""))
                );
                if (liveNode) {
                    focus(liveNode, {});
                } else {
                    console.warn("Node not found in graph.nodes for", value);
                }
});
        newdiv
            .append("label")
            .append("a")
            .attr("href",cval)
            .attr("target","_blank")
            .text(c["label"])
        ;
    });
}

async function getInstitutionList(nodes) {
    loadinginfo.style('display', 'block');
    nodes.sort((a, b) => (a["label"] > b["label"]) ? 1 : ((b["label"] > a["label"]) ? -1 : 0))

    institutionNodes = nodes.filter(node => node.instanceOf !== "human");
    humanNodes = nodes.filter(node => node.instanceOf == "human");

    await buildItemList(institutionNodes, "institutions");
    await buildItemList(humanNodes, "humans");
}

let perpetrators = []
async function getGraphData() {
    loadingGraph.text("Fetching extra graph links from WikiData...this can take a long time");
    try {
        const params = new URLSearchParams({
            from_accomplices: None,
            country=
        });

        const response = await fetch(`/api/v1/graph/graph/?${params.toString()}`);
        const graph = await response.json();

        const graphstore = { ...graph };
        console.log("Graph fetched from API:", graph);
        return { links: graph.edges , nodes: graph.nodes };

    } catch (error) {
        console.error("Failed to load graph:", error);
    }

}


let width = screen.availWidth, height = screen.availHeight;


let simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id((d) => d.id))
    .force('charge', d3.forceManyBody().strength(d => d.group == 2 ? -500 :  -5))
    // .force('center', d3.forceCenter(width / 2, height / 2) )
    .force("x", d3.forceX(width / 2).strength(0.5))
    .force("y", d3.forceY(height / 2).strength(0.5))
    .force("collide",d3.forceCollide().radius(4.5)) // d => d.radius  is slow
    .alphaDecay(0.05)
;

let app = new PIXI.Application({
    width : width,
    height : height ,
    antialias: !0,
    transparent: !0,
    resolution: 1
}); // Convenience class that automatically creates the renderer, ticker and root container.
document.body.appendChild(app.view);

function drawGraph(graph) {
    constructingGraph.style('display', 'block');
    console.log("drawgraph", graph);
    // TRANSFORM THE DATA INTO A D3 GRAPH
    simulation
  .nodes(graph.nodes)

    simulation
    .force("link", d3.forceLink(graph.links).id(d => d.id).distance(50))
    .force("charge", d3.forceManyBody().strength(-200)) // More negative = more repulsion
    .force("center", d3.forceCenter(app.renderer.width / 2, app.renderer.height / 2)); // optional: center force



    // count incoming links to set node sizes, and remove nodes with no radius, stemming from super-ideologies
    // to do :
    // graph = computeAllConnectedCounts(graph);

    simulation.force("charge", d3.forceManyBody()
        .strength(d => -50 - (d.linkCount || 0) * 10)  // more repulsion if more links
    )
    // graph.links = graph.links.filter(l => ! isNaN(l.source.radius));
    // remove freely floating nodes
    // graph.nodes = graph.nodes.filter(n =>  graph.links.filter(l =>
    //     l.source == n | l.target == n
    // ).length > 0 );

    // Render with PIXI ------

    // the LINKS are just one object that actually gets drawn in the ticks:
    let containerLinks = new PIXI.Container();
    let links = new PIXI.Graphics();
    containerLinks.addChild(links);

    // render NODES

    let containerperpetrators = new PIXI.Container();
    let containerIteration1 = new PIXI.Container();
    // https://stackoverflow.com/questions/36678727/pixi-js-drag-and-drop-circle
    graph.nodes.forEach((node) => {
        node.gfx = new PIXI.Graphics();
        node.gfx.lineStyle(0.5, 0xFFFFFF);
        const dist = node.distance ?? 0;
        node.gfx.beginFill(node.colour);
        node.gfx.drawCircle(0, 0, node.radius);
        node.gfx.interactive = true;
        node.gfx.hitArea = new PIXI.Circle(0, 0, node.radius);
        node.gfx.mouseover = function(ev) { showHoverLabel(node, ev)};
        node.gfx.on("pointerdown", function(ev) { focus(node,ev);});
        node.gfx
           .on('mousedown', onDragStart)
           .on('touchstart', onDragStart)
           .on('mouseup', onDragEnd )
           .on('mouseupoutside', onDragEnd )
           .on('touchend', onDragEnd)
           .on('touchendoutside', onDragEnd)
           .on('mousemove', onDragMove)
           .on('touchmove', onDragMove)
        ;

        if (node.group==1) containerperpetrators.addChild(node.gfx);
        if (node.group == 2) containerIteration1.addChild(node.gfx);

        if (["human"].includes(node.instanceOf)) {
            node.gfx.drawRect(-node.radius, -node.radius, node.radius * 2, node.radius * 2)
        }
        // main persecutors graphics
        if (node.group == 1) {
            node.lgfx = new PIXI.Text(
                node.label, {
                    fontFamily : 'Maven Pro',
                    fontSize: 9 + node.radius / 2,
                    fill: node.colour,
                    align : 'center'
                }
            );
            node.lgfx.resolution = 2; // so that the text isn't blury
            containerperpetrators.addChild(node.lgfx);
        }

        // first iteration graphics
        if (node.group == 2) {
            node.lgfx = new PIXI.Text(
            );
            node.lgfx.resolution = 2; // so that the text isn't blury
            containerIteration1.addChild(node.lgfx);
        }

    });


    containerLinks.zIndex = 0;
    containerperpetrators.zIndex = 1;
    containerIteration1.zIndex = 2;

    app.stage.addChild(containerLinks);
    app.stage.addChild(containerperpetrators);
    app.stage.addChild(containerIteration1);

    app.stage.children.sort((itemA, itemB) => itemA.zIndex - itemB.zIndex);

    zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", zoomAndPan);

    canvas = d3.select(app.view);
    canvas.call(zoom);
    // ticked()
    simulation.on('tick', ticked);
    function ticked() {
        // requestAnimationFrame(ticked); //this d3 on.ticker can be replaced by PIXI's "requestAnimationFrame" but the system is then too excited. See above
        graph.nodes.forEach((node) => {
            let { x, y, gfx, lgfx, radius } = node;
            gfx.position = new PIXI.Point(x, y);
            if (node.group == 1) lgfx.position = new PIXI.Point(x + radius / 2, y + radius / 2);
            // if (node.group == 3) lgfx.position = new PIXI.Point(x - radius / 2, y - radius / 2);
            // if (node.group == 4) lgfx.position = new PIXI.Point(x - radius / 2, y - radius / 2);
        });
        links.clear();
        links.alpha = 0.6;
        graph.links.forEach((link) => {
            let { source, target } = link;
            let alpha = link.alpha !== undefined ? link.alpha : 1;
            links.lineStyle(Math.sqrt(link.value || 1), 0x999999, alpha);
            links.moveTo(source.x, source.y);
            links.lineTo(target.x, target.y);
        });
        links.endFill();
        // renderer.render(stage); // not necessary if using app.

        // when this point is reached, the notification about loading can be removed
        loadinginfo.style('display', 'none');
        constructingGraph.style('display', 'none');
        document.getElementById("upgradeGraphButton").disabled = false;
    }

    simulation.alphaTarget(0.05).restart(); // give it an initial push
    console.log("Graph drawn with", graph);
    return graph;
}

// DRAG, PAN AND ZOOM

var transform = {k:1,x:0,y:0};
function zoomAndPan() {
    transform = d3.event.transform;
    app.stage.scale.x = app.stage.scale.y = d3.event.transform.k;
    if(!draggingNode ) {
    app.stage.x = transform.x;
    app.stage.y = transform.y;
    }
}

// pixi node drag
let draggingNode = false;
function onDragStart(event){
    simulation.alphaTarget(0.05).restart(); // the higher, the more sensitive and excited.
    this.data = event.data;
    var newPosition = this.data.getLocalPosition(this.parent);
    let node = graph.nodes.filter(n=>n.gfx == this)[0];
    node.fx = newPosition.x;
    node.fy = newPosition.y;
    this.dragging = true;
    draggingNode = true;
}

function onDragEnd(){
    this.dragging = false;
    draggingNode = false;
    this.data = null;
    let node = graph.nodes.filter(n=>n.gfx == this)[0];
    node.fx = null;
    node.fy = null;
}

function onDragMove(){
    if (this.dragging){
        var newPosition = this.data.getLocalPosition(this.parent);
        let node = graph.nodes.filter(n=>n.gfx == this)[0];
        node.fx = newPosition.x;
        node.fy = newPosition.y;
    }
}


function unSelectAllCountries(){
    let allBoxes = d3.selectAll("input[type='checkbox']");
    allBoxes._groups[0].forEach(b=>{b.checked = false});
}

function selectGroupAndUpdate(group){
    unSelectAllCountries();
    let allBoxes = d3.selectAll("input[type='checkbox']");
    allBoxes._groups[0].forEach(b=>{
        if (group.includes(b.value)) b.checked = true
    });
    updateGraph();
}

// Graph hover and highlight -------

let rootSelectedNode = {};

// https://observablehq.com/@d3/drag-zoom

function showHoverLabel(node, ev) {
    let nodex, nodey;
    if (ev && ev.data && ev.data.global) {
        // PIXI pointer event
        nodex = ev.data.global.x + 15;
        nodey = ev.data.global.y - 15;
    } else  if (node.gfx) {
        // get the global position of the node gfx container/sprite
        const globalPos = node.gfx.toGlobal(new PIXI.Point(0, 0));
        nodex = globalPos.x + 15;
        nodey = globalPos.y - 15;
    } else {
      console.error("Node position is not defined", node);
    }
    d3.select("#label")
        .attr("style", `left:${nodex}px;top:${nodey}px;`)
        .select("a")
        .attr("href", node.id.replace("wd:", "http://www.wikidata.org/entity/"))
        .attr("target", "_blank")
        .text(node.label);
}

function centerOnNode(d) {
    const canvas = d3.select(app.view); // canvas DOM element wrapped in D3
    const scale = transform.k;

    const centerX = app.renderer.view.width / 2;
    const centerY = app.renderer.view.height / 2;

    const translateX = centerX - d.x * scale;
    const translateY = centerY - d.y * scale;

    const newTransform = d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(scale);

    canvas.call(zoom.transform, newTransform); // no .transition()
}



function focus(d,ev) {
    showHoverLabel(d,ev); // nececessary for touch screen
    if (rootSelectedNode == d) {
        unfocus();
    } else {
        rootSelectedNode = d;
        markSelected(d, 2);
        centerOnNode(d);
    }
    updateColor();
    console.log("focus on", d);
}

function unfocus() {
    graph.nodes.forEach(n => {n.marked = true});
    graph.links.forEach(l => {l.marked = true});
    rootSelectedNode = {};
}

function markSelected(startNode, maxDepth) {
    graph.nodes.forEach(n => n.marked = false);
    graph.links.forEach(l => l.marked = false);

    let visited = new Set();
    let queue = [{ node: startNode, depth: 0 }];

    while (queue.length > 0) {
        const { node, depth } = queue.shift();

        if (visited.has(node.id) || depth > maxDepth) continue;

        node.marked = true;
        visited.add(node.id);
        graph.links.forEach(link => {
            const isConnected = link.source === node || link.target === node;
            if (isConnected) {
                link.marked = true;

                const neighbor = link.source === node ? link.target : link.source;

                if (!visited.has(neighbor.id)) {
                    queue.push({ node: neighbor, depth: depth + 1 });
                }
            }
        });
    }
}


function updateColor() {
    graph.nodes.filter(n => !n.marked).forEach(n => {
        n.gfx.alpha = 0.2;
        if (n.group == 2) n.lgfx.alpha=0.2
    });
    graph.links.filter(l => !l.marked).forEach(l => l.alpha = 0.1 );
    graph.nodes.filter(n => n.marked).forEach(n => {
        n.gfx.alpha = 1;
        if (n.group == 2) n.lgfx.alpha =1
    });
    graph.links.filter(l => l.marked).forEach(l => l.alpha = 1);
}


// Graph updates ------------
async function updateGraph() {
    document.getElementById("upgradeGraphButton").disabled = true;
    simulation.stop();
    graph = graphstore = null;
    loadinginfo.style('display', 'block');
    updatingGraph.style('display', 'block');
    app.stage.removeChildren();
    // wait before launching
    (graph = await getOrCreateCachedGraph(useCache = false));
    graph = drawGraph(graph);
    getInstitutionList(graph.nodes);
    document.getElementById("upgradeGraphButton").disabled = false;
}



/*

COMPLICITYGRAPH - explore ideologies of political perpetrators with SPAQRL requests to WikiData, D3 and PixiJS.

forked from ideogaph

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */
