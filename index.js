let endpoint = "https://query.wikidata.org/sparql?query=";
// messages:
let loadinginfo = d3.select("#loadinginfo");
let loadingCountries = d3.select("#loadingCountries");
let countriesLoaded = d3.select("#countriesLoaded");
let loadingGraph = d3.select("#loadingGraph");
let constructingGraph = d3.select("#constructingGraph");
let updatingGraph = d3.select("#updatingGraph");
let loadinginfotext = "";
// neccessary globals
let graph, graphstore, canvas ; 

// Make a list of countries
getCountryList();
let Europe = ["wd:Q1246", // Kosovo
    "wd:Q142", "wd:Q145", // UK
    "wd:Q183", "wd:Q189", // Iceland
    "wd:Q191", // Estonia
    "wd:Q20", // Norway
    "wd:Q25", // Wales
    "wd:Q211", // Latvia
    "wd:Q212", // Ukraine
    "wd:Q213", "wd:Q214", // Slovenia
    "wd:Q215", // Slovakia
    "wd:Q217", // Moldova
    "wd:Q218", // Romania
    "wd:Q219", "wd:Q221", // Northern Macedonia
    "wd:Q222", // Albania
    "wd:Q223", // Greenland
    "wd:Q224", "wd:Q225", "wd:Q228", // Andora
    "wd:Q229", "wd:Q233", // Malta
    "wd:Q235", // Monaco
    "wd:Q236", // Montenegro
    "wd:Q238", // San Marino
    "wd:Q27", // Ireland
    "wd:Q28", // Hungary
    "wd:Q29", // Spain
    "wd:Q31", "wd:Q32", // Luxembourg
    "wd:Q33", // Finlannd
    "wd:Q34", // Sweden
    "wd:Q347", // Lichtenstein
    "wd:Q35", "wd:Q36", // Poland
    "wd:Q37", // Lituania
    "wd:Q38","wd:Q39","wd:Q40","wd:Q403", // Serbia
    "wd:Q41" ,// Greece
    "wd:Q45", // Portugal
    "wd:Q4628", // Faroe Islands
    "wd:Q55", // Netherlands
    "wd:Q9676" // Isle of Man
];
let subsaharanAfrica = ["wd:Q916","wd:Q962","wd:Q963","wd:Q965","wd:Q967","wd:Q1009","wd:Q929","wd:Q657","wd:Q974","wd:Q977","wd:Q983","wd:Q986","wd:Q1050","wd:Q115","wd:Q1000","wd:Q117","wd:Q1006","wd:Q1007","wd:Q1008","wd:Q114","wd:Q1013","wd:Q1014","wd:Q1019","wd:Q1020","wd:Q912","wd:Q1025","wd:Q1029","wd:Q1030","wd:Q1032","wd:Q1033","wd:Q971","wd:Q1041","wd:Q1045","wd:Q34754","wd:Q258","wd:Q1049","wd:Q924","wd:Q1005","wd:Q945","wd:Q1036","wd:Q953","wd:Q954"]
let Asia = ["wd:Q851","wd:Q40362", "wd:Q244165", "wd:Q1027", "wd:Q826", "wd:Q801", "wd:Q574","wd:Q889", "wd:Q399", "wd:Q619829", "wd:Q227", "wd:Q398", "wd:Q902", "wd:Q917", "wd:Q424", "wd:Q326343", "wd:Q230", "wd:Q8646", "wd:Q668", "wd:Q252", "wd:Q17", "wd:Q810", "wd:Q232", "wd:Q41470", "wd:Q205047", "wd:Q817", "wd:Q813", "wd:Q819", "wd:Q822", "wd:Q14773", "wd:Q833", "wd:Q711", "wd:Q836", "wd:Q837", "wd:Q423", "wd:Q843", "wd:Q148", "wd:Q928", "wd:Q334", "wd:Q884", "wd:Q23427", "wd:Q854", "wd:Q219060", "wd:Q858", "wd:Q865", "wd:Q863", "wd:Q869", "wd:Q43", "wd:Q23681", "wd:Q874", "wd:Q1498", "wd:Q265", "wd:Q881"]
let CanadaAndUS = ["wd:Q16","wd:Q30"];
let LatinAmerica = ["wd:Q414","wd:Q21203","wd:Q242","wd:Q23635","wd:Q155","wd:Q5785","wd:Q298","wd:Q739","wd:Q800","wd:Q241","wd:Q784","wd:Q786","wd:Q736","wd:Q792","wd:Q769","wd:Q774","wd:Q734","wd:Q790","wd:Q783","wd:Q766","wd:Q96","wd:Q811","wd:Q804","wd:Q733","wd:Q419","wd:Q730","wd:Q754","wd:Q18221","wd:Q77","wd:Q717"];
let RussiaAndBelarus = ["wd:Q184","wd:Q159"];
let NorthAfrica =["wd:Q262","wd:Q79","wd:Q1016","wd:Q1028","wd:Q948"];
let Oceania = [ "wd:Q408", "wd:Q26988", "wd:Q712", "wd:Q697", "wd:Q664", "wd:Q691", "wd:Q683", "wd:Q678", "wd:Q686"];

// INITIALISATION
document.getElementById("upgradeGraphButton").disabled = true; 
getGraphData(Europe);

/** Fetches csv data wrom wikidata 
 * @param req a URI ecoded SPARQL query 
*/
async function fetchWikiData(req) {
    let response = await fetch(req, {headers: { "Accept": "text/csv"}});  
    let text = await response.text(); 
    let data = Papa.parse(text,{
        header:true,
        skipEmptyLines:true,
        transformHeader: function(h) {return h.trim();} // remove white spaces from header vars
    });
    data = data.data;
    return data ;
}

async function fetchWikiDataPOST(query) {
  const endpoint = 'https://query.wikidata.org/';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      'Accept': 'application/sparql-results+json',
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`SPARQL request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
/** Constructs a list of countnries to choose from. 
 * On first run, launch graph construction. */ 
async function getCountryList() { 
    loadinginfo.style('display', 'block');
    loadingCountries.style('display', 'block');
    let sparql = await (await fetch('sparql/CountryList.rq')).text();
    let req = endpoint + encodeURIComponent(sparql.replace("/#.*/gm",''));
    let countries = await fetchWikiData(req);
    // console.log(countries);
    countries.sort((a,b) => (a["countryLabel"] > b["countryLabel"]) ? 1 : ((b["countryLabel"] > a["countryLabel"]) ? -1 : 0))
    let countriesdiv = d3.select("#countryselector");
    countries.forEach(c=>{
        let newdiv = countriesdiv.append("div")
        let cval = c.country.replace("http://www.wikidata.org/entity/","wd:");
        let cid = cval.replace("wd:","c")
        newdiv
            .append("input")
            .attr("type","checkbox")
            .attr("name", c["countryLabel"])
            .attr("id",cid)
            .attr("value", cval) 
            //.attr("onclick","updateGraph()")
        ;
        newdiv
            .append("label")
            .append("a")
            .attr("href",c.country)
            .attr("target","_blank")
            .text(c["countryLabel"])
        ;
    });
    Europe.forEach(cval => document.getElementById(cval.replace("wd:","c")).checked = true);
    loadingCountries.style('display', 'none');
    countriesLoaded.style('display', 'block');
}

function pushItemsToObject(nodes, links, items) {
    items.forEach((line) => {
        if (typeof line.item !== "undefined" && typeof line.linkTo !== "undefined") {
            perpetrators.push(line.item.replace("http://www.wikidata.org/entity/", "wd:"));
            nodes.push({
                id: line.item.replace("http://www.wikidata.org/entity/", "wd:"),
                label: line.itemLabel + " (" + line.countryLabel + ")",
                typeOfLink: line["typeOfLink"],
                instanceOf: line["instanceOfLabel"],
                group: 1
            });
            nodes.push({
                id: line.linkTo.replace("http://www.wikidata.org/entity/", "wd:"),
                label: line["linkToLabel"],
                typeOfLink: line["typeOfLink"],
                instanceOf: line["instanceOfLabel"],
                group: 2
            });
            links.push({
                source: line.item.replace("http://www.wikidata.org/entity/", "wd:"),
                target: line.linkTo.replace("http://www.wikidata.org/entity/", "wd:"),
                value: 0.5
            });
        }
    });
    // remove duplicates but keep isPerpetrator to allow candidateRootsIDs to find them
    const nodeMap = new Map();
    nodes.forEach(node => {
        const existing = nodeMap.get(node.id);

        if (!existing) {
            nodeMap.set(node.id, node);
        } else if (node.typeOfLink === "isPerpetrator") {
            nodeMap.set(node.id, node); // overwrite with higher-priority type
        }
    });

    nodes = Array.from(nodeMap.values());
    return { nodes, links };
}
    
let perpetrators = []
/** Fetches the graph data from wikidata 
 * @param countries An array of countries
*/
async function getGraphData(countries) {   
    let nodes = [];
    let links = [];

    loadinginfo.style('display', 'block');
    loadingGraph.style('display', 'block');
    let sparql1 = await (await fetch('sparql/Base.rq')).text(); 
    let req = endpoint + encodeURIComponent(sparql1.replace("JSVAR:COUNTRIES",countries.join(" ")).replace("/#.*/gm",''));
    let data = await fetchWikiData(req);
    ({ nodes, links } = pushItemsToObject(nodes, links, data));
    console.log("organisations", data);

    let organisationsWDid = data.map(d => d.item.replace("http://www.wikidata.org/entity/","wd:"));
    let sparql2 = await (await fetch('sparql/CEO.rq')).text();
    let reqExtra = endpoint + encodeURIComponent(sparql2.replace("JSVAR:ORGID",organisationsWDid.join(" ")).replace("/#.*/gm",''));
    let CEOData = await fetchWikiData(reqExtra);
    ({ nodes, links } = pushItemsToObject(nodes, links, CEOData));
    console.log("CEO data", CEOData);
    
    loadingGraph.text("Fetching extra graph links from WikiData...");
    
    // france / isral / cac40
    const toRemove = ["wd:Q1450662", "wd:Q801", "Q648828"]

    let sparql3 = await (await fetch('sparql/Iteration.rq')).text(); 
    // we remove big organization : french republic / Israel
    organisationsWDid = organisationsWDid.filter(id => !toRemove.includes(id));
    let req3 = endpoint + encodeURIComponent(sparql3.replace("SVAR:SUBPERPETRATOR",organisationsWDid.join(" ")).replace("/#.*/gm",''));
    let data3 = await fetchWikiData(req3);
    ({ nodes, links } = pushItemsToObject(nodes, links, data3));
    console.log("organisationsrecursive", data3);
    console.log("nodes", nodes);

    //  second recursion, not working, not clean
    // organisationsWDid = nodes.map(d => d.id);
    // organisationsWDid = organisationsWDid.filter(id => !toRemove.includes(id));
    // const half = Math.ceil(organisationsWDid.length / 2);
    // const firstHalf = organisationsWDid.slice(0, half);
    // const secondHalf = organisationsWDid.slice(half);

    // let sparql4 = await (await fetch('sparql/Iteration.rq')).text(); 
    // let req4 = endpoint + encodeURIComponent(sparql4.replace("SVAR:SUBPERPETRATOR",firstHalf.join(" ")).replace("/#.*/gm",''));
    // let data4_1 = await fetchWikiData(req4);
    // ({ nodes, links } = pushItemsToObject(nodes, links, data4_1));
    // console.log("organisationsrecursive2 - first half", data4_1);

    // let req4_2 = endpoint + encodeURIComponent(sparql4.replace("SVAR:SUBPERPETRATOR",secondHalf.join(" ")).replace("/#.*/gm",''));
    // let data4_2 = await fetchWikiData(req4_2);
    // ({ nodes, links } = pushItemsToObject(nodes, links, data4_2));
    // console.log("organisationsrecursive2 - first half", data4_2);




        // to do : ceo of first iteration ? 

    const candidateRootsIDs = nodes
    .filter(node => node.typeOfLink === "isPerpetrator")
        .map(node => node.id);
    
    links.forEach(function(link){
        if (!link.target["linkCount"]) link.target["linkCount"] = 0;
        link.target["linkCount"]++;    
    });

    // colour
    console.log("nodes get graph data", nodes, "links", links);
    const candidateRootsIDSet = new Set(candidateRootsIDs);
    const candidateRoots = nodes
    .filter(node => candidateRootsIDSet.has(node.id))
    .map(node => node.id);
    console.log("candidate roots", candidateRoots);
    distances = computeDistancesFromRoot(candidateRoots, nodes, links)
    let maxDistance = Math.max(...Object.values(distances));
    nodes.forEach((node) => {
        node.colour = distances[node.id];    
    });
    console.log("distances", distances, "maxDistance", maxDistance);


    graph = { links: links, nodes: nodes };
    console.log("nodes", graph.nodes, "links", graph.links)
    // store the full graph for later use
    graphstore = Object.assign({}, graph);
    drawGraph(graph);
}


let width = screen.availWidth, height = screen.availHeight;

// color stuff
// function colour(num) {
//     if (num == 3) return 0x969af1 // should be
//     if (num==4) return 0x44d15e
//     if (num > 1) return 0xD01B1B
//     return 0x47abd8 ;
// }

function computeDistancesFromRoot(candidateRoots, nodes, links) {
    let distances = {};
    let visited = new Set();
    let queue = [];
    // Initialize queue and distances with all roots at distance 0
    candidateRoots.forEach(rootId => {
        distances[rootId] = 0;
        queue.push({ id: rootId, dist: 0 });
        visited.add(rootId);
    });

    while (queue.length > 0) {
        let { id, dist } = queue.shift();

        // Get neighbors of the current node
        let neighbors = links
            .filter(l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return sid === id || tid === id;
            })
            .map(l => {
                const sid = typeof l.source === 'object' ? l.source.id : l.source;
                const tid = typeof l.target === 'object' ? l.target.id : l.target;
                return sid === id ? tid : sid;
            });

        neighbors.forEach(nid => {
            // If not visited or found a shorter path to nid, update distance
            if (!visited.has(nid) || distances[nid] > dist + 1) {
                distances[nid] = dist + 1;
                if (!visited.has(nid)) {
                    visited.add(nid);
                    queue.push({ id: nid, dist: dist + 1 });
                }
            }
        });
    }

    return distances;
}

let interpolate = d3.interpolateRgb("#D01B1B", "#2930f8"); // violet → red
function getInterpolatedColor(t) {
    const rgbString = interpolate(t);
    const rgb = d3.color(rgbString);  
    // Convert to 0xRRGGBB format
    return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
}

/*
let colour = (function() {
    let scale = d3.scaleOrdinal(d3.schemeCategory20);
    return (num) => parseInt(scale(num).slice(1), 16);
})();
*/

let simulation = d3.forceSimulation()
            // to increadi link distance
            // .force('link', d3.forceLink()
            // .id(d => d.id)
            // .distance(link => {
            //     // Increase distance if source or target is group 3 (CEO)
            //     if ((typeof link.source === 'object' ? link.source.group : null)in [3,4] || 
            //         (typeof link.target === 'object' ? link.target.group : null) in [3,4]) {
            //         return 150;  // You can tweak this value
            //     }
            //     return 50; // default link distance
            // })
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

/** Draws the graph using D3js and PIXIjs 
 * @param graph A JSON encoded set of nodes and links
*/
function drawGraph(graph) {
    constructingGraph.style('display', 'block');
    console.log(graph);

    // TRANSFORM THE DATA INTO A D3 GRAPH
    simulation
        .nodes(graph.nodes)
        .on('tick', ticked) // this d3 ticker can be replaced by PIXI's "requestAnimationFrame" but the system is then too excited
        .force('link')
          .links(graph.links);

    // count incoming links to set node sizes, and remove nodes with no radius, stemming from super-ideologies
    graph.links.forEach(function(link){
        if (!link.target["linkCount"]) link.target["linkCount"] = 0;
        link.target["linkCount"]++;    
    });
    graph.nodes.forEach((node) => {
        if (!node.linkCount) node.linkCount = 0;
        node.radius = 3 + Math.sqrt(node.linkCount);
    });
    graph.links = graph.links.filter(l => ! isNaN(l.source.radius));
    // remove freely floating nodes
    graph.nodes = graph.nodes.filter(n =>  graph.links.filter(l => 
        l.source == n | l.target == n
    ).length > 0 );

    // Render with PIXI ------

    // the LINKS are just one object that actually gets drawn in the ticks:
    let containerLinks = new PIXI.Container();
    let links = new PIXI.Graphics();
    containerLinks.addChild(links);

    // render NODES

    let containerperpetrators = new PIXI.Container();
    let containerIdeologies = new PIXI.Container();
    let containerCEO = new PIXI.Container();
    let containerRecursion = new PIXI.Container();
    // https://stackoverflow.com/questions/36678727/pixi-js-drag-and-drop-circle
    graph.nodes.forEach((node) => {
        node.gfx = new PIXI.Graphics();
        node.gfx.lineStyle(0.5, 0xFFFFFF);
        node.gfx.beginFill(getInterpolatedColor(distances[node.id] / Math.max(...Object.values(distances))));
        node.gfx.drawCircle(0, 0, node.radius );
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
        if (node.group == 2) containerIdeologies.addChild(node.gfx);
        if (node.group == 3) containerCEO.addChild(node.gfx);
        if (node.group == 4) containerRecursion.addChild(node.gfx);
        // stage.addChild(node.gfx);

        if (["human"].includes(node.instanceOf)) {
            node.gfx.drawRect(-node.radius, -node.radius, node.radius * 2, node.radius * 2)
        }
        // main persecutors 
        if (node.group == 2) {
            node.lgfx = new PIXI.Text(
                node.label, {
                    fontFamily : 'Maven Pro', 
                    fontSize: 9 + node.radius / 2, 
                    fill: node.colour, 
                    align : 'center'
                }
            );
            node.lgfx.resolution = 2; // so that the text isn't blury
            containerIdeologies.addChild(node.lgfx);
        }

    });


    containerLinks.zIndex = 0;
    containerIdeologies.zIndex = 2;
    containerperpetrators.zIndex = 1;
    containerCEO.zIndex = 3;
    containerRecursion.zIndex = 4;

    app.stage.addChild(containerLinks);
    app.stage.addChild(containerperpetrators);
    app.stage.addChild(containerIdeologies);
    app.stage.addChild(containerCEO);
    app.stage.addChild(containerRecursion);

    app.stage.children.sort((itemA, itemB) => itemA.zIndex - itemB.zIndex);

    // dragging the nodes around is perhaps less useful than zooming
    canvas = d3.select(app.view)
    canvas.call(
        d3.zoom().scaleExtent([0.5, 3]).on("zoom", zoomAndPan)
    );

    // ticked()
    function ticked() {
        // requestAnimationFrame(ticked); //this d3 on.ticker can be replaced by PIXI's "requestAnimationFrame" but the system is then too excited. See above
        graph.nodes.forEach((node) => {
            let { x, y, gfx, lgfx, radius } = node;
            gfx.position = new PIXI.Point(x, y);
            if (node.group == 2) lgfx.position = new PIXI.Point(x + radius / 2, y + radius / 2);
            // if (node.group == 3) lgfx.position = new PIXI.Point(x - radius / 2, y - radius / 2);
            // if (node.group == 4) lgfx.position = new PIXI.Point(x - radius / 2, y - radius / 2);
        });
        links.clear();
        links.alpha = 0.6;
        graph.links.forEach((link) => {
            let { source, target } = link;
            links.lineStyle(Math.sqrt(link.value), 0x999999,link.alpha);
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
}

// DRAG, PAN AND ZOOM

var transform = {k:1,x:0,y:0}; 
function zoomAndPan() {
    // console.log(d3.event.transform);
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
    simulation.alphaTarget(0.05).restart(); // the higer, the more sensitive and excited.
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
    console.log(group);
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

function showHoverLabel(node,ev) {
    let nodex = (ev.data.global.x + 15) ;
    let nodey = (ev.data.global.y - 15)  ;
    d3.select("#label")
        .attr("style", "left:"+nodex+"px;top:"+nodey+"px;")
        .select("a")
        .attr("href",node.id.replace("wd:","http://www.wikidata.org/entity/"))
        .attr("target","_blank")
        .text(node.label)  
}

function focus(d,ev) {
    console.log(d);
    showHoverLabel(d,ev); // nececessary for touch screen
    if (rootSelectedNode == d) {
        unfocus();
    } else {
        rootSelectedNode = d;
        markSelected(d);
    }
    updateColor();  
}

function unfocus() {
    graph.nodes.forEach(n => {n.marked = true});
    graph.links.forEach(l => {l.marked = true});
    rootSelectedNode = {};
}

function markSelected(d){
    graph.nodes.forEach(n => {n.marked = false})
    graph.links.forEach(l => {l.marked = false})
    d.marked = true;
    let linked = [];
    graph.links.filter(l => 
        l.source == d | l.target == d
    ).forEach(l => {
        l.marked = true;
        linked.push(l.source.id);
        linked.push(l.target.id)
    });
    graph.nodes.forEach(n => n.marked = linked.includes(n.id) ? true : false)
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

/** Updates the graph with data from a new set of countries */
function updateGraph(){
        document.getElementById("upgradeGraphButton").disabled = true; 
        simulation.stop();
        graph = graphstore = null;
        loadinginfo.style('display', 'block');
        updatingGraph.style('display', 'block');
        let checked = [];
        let boxes = d3.selectAll("input[type='checkbox']:checked")
        boxes._groups[0].forEach(b=>{
            checked.push(b.value)
        });
        console.log(checked);
        app.stage.removeChildren();
        // wait before launching
        getGraphData(checked);
}

// TODO add element without destroying everything
function restoreGraph(){
    // add all elements to graph removed by previous filter
    graphstore.nodes.forEach(sn => {
        if (graph.nodes.filter(n=> n.id == sn.id).length==0) graph.nodes.push(Object.assign({}, sn));
    })
    // TODO : something's wrong with attaching those links
    graphstore.links.forEach(sl => {
        if (graph.links.filter(l=> l.id == sl.id).length==0) graph.links.push(Object.assign({}, sl));
    })
    // relink nodes correcly
    graph.links.forEach(l => {
        l.source = graph.nodes.filter(n=> n.id == l.source.id)[0];
        l.target = graph.nodes.filter(n=> n.id == l.target.id)[0];
    });
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