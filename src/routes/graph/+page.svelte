<script>
    import { onMount } from 'svelte';

    // Predefined Graph Data
    const INITIAL_NODES = [
        { id: 'A', x: 400, y: 50 },
        { id: 'B', x: 200, y: 150 },
        { id: 'C', x: 600, y: 150 },
        { id: 'D', x: 300, y: 300 },
        { id: 'E', x: 500, y: 300 }
    ];

    const INITIAL_EDGES = [
        { u: 'A', v: 'B', weight: 4 },
        { u: 'A', v: 'C', weight: 2 },
        { u: 'B', v: 'C', weight: 1 },
        { u: 'B', v: 'D', weight: 5 },
        { u: 'C', v: 'D', weight: 8 },
        { u: 'C', v: 'E', weight: 10 },
        { u: 'D', v: 'E', weight: 2 },
        { u: 'E', v: 'A', weight: 6 }
    ];

    let nodes = [];
    let edges = [];
    let logs = [];
    let activeLine = -1;
    let activeOperation = '';
    let currentGenerator = null;
    let timeoutId = null;
    let speed = 600;
    let traversalResult = [];
    let statusMessage = '';
    let variables = { current: null, queue: [], stack: [], distances: {}, priorityQueue: [], mstWeight: 0 };
    let startNodeId = 'A';
    let showMatrix = true;

    $: adjList = nodes.reduce((acc, n) => ({ ...acc, [n.id]: [] }), {});
    $: {
        edges.forEach(e => {
            if (adjList[e.u]) adjList[e.u].push({ node: e.v, weight: e.weight });
            if (adjList[e.v]) adjList[e.v].push({ node: e.u, weight: e.weight });
        });
    }

    const ALGO_CODE = {
        bfs: [
            "queue.enqueue(startNode)",
            "visited.add(startNode)",
            "while queue is not empty:",
            "  curr = queue.dequeue()",
            "  process neighbors..."
        ],
        dfs: [
            "stack.push(startNode)",
            "while stack is not empty:",
            "  curr = stack.pop()",
            "  process neighbors..."
        ],
        dijkstra: [
            "dist[start] = 0; pq.enqueue(start, 0)",
            "while pq is not empty:",
            "  curr, d = pq.dequeue()",
            "  relax neighbors..."
        ],
        prim: [
            "visited.add(startNode); pq.enqueue(edges of start)",
            "while pq is not empty and |visited| < V:",
            "  edge (u, v) = pq.dequeueMin()",
            "  if v in visited: continue",
            "  visited.add(v); add edge to MST",
            "  pq.enqueue(edges of v)"
        ],
        kruskal: [
            "sort edges by weight",
            "for each edge (u, v) in sorted edges:",
            "  if find(u) != find(v):",
            "    union(u, v)",
            "    add edge to MST",
            "  else: ignore (forms cycle)"
        ]
    };

    function log(message, type = '') {
        logs = [...logs, { message, type, time: new Date().toLocaleTimeString() }];
    }

    function initGraph() {
        nodes = INITIAL_NODES.map(n => ({ ...n, state: 'default', distance: Infinity }));
        edges = INITIAL_EDGES.map(e => ({ ...e, state: 'default' }));
        variables.mstWeight = 0;
        variables.priorityQueue = [];
    }

    function getNode(id) { return nodes.find(n => n.id === id); }
    function getEdge(u, v) { return edges.find(e => (e.u === u && e.v === v) || (e.u === v && e.v === u)); }

    let parentDSU = {};
    function find(i) {
        if (parentDSU[i] === i) return i;
        return find(parentDSU[i]);
    }
    function union(i, j) {
        let rootI = find(i);
        let rootJ = find(j);
        parentDSU[rootI] = rootJ;
    }

    // --- Generators ---

    function* bfsGenerator(startId) {
        activeOperation = 'bfs';
        variables.queue = [startId];
        let visited = new Set([startId]);
        activeLine = 0; yield;
        while (variables.queue.length > 0) {
            let currId = variables.queue.shift();
            variables.current = currId;
            variables.queue = [...variables.queue];
            getNode(currId).state = 'visited';
            nodes = [...nodes];
            traversalResult = [...traversalResult, currId];
            yield;
            for (let neighbor of adjList[currId]) {
                if (!visited.has(neighbor.node)) {
                    visited.add(neighbor.node);
                    variables.queue.push(neighbor.node);
                    variables.queue = [...variables.queue];
                    getEdge(currId, neighbor.node).state = 'visited';
                    edges = [...edges];
                    yield;
                }
            }
        }
        finish();
    }

    function* dfsGenerator(startId) {
        activeOperation = 'dfs';
        variables.stack = [startId];
        let visited = new Set();
        while (variables.stack.length > 0) {
            let currId = variables.stack.pop();
            variables.current = currId;
            variables.stack = [...variables.stack];
            if (!visited.has(currId)) {
                visited.add(currId);
                getNode(currId).state = 'visited';
                nodes = [...nodes];
                traversalResult = [...traversalResult, currId];
                yield;
                for (let neighbor of [...adjList[currId]].reverse()) {
                    if (!visited.has(neighbor.node)) {
                        variables.stack.push(neighbor.node);
                        variables.stack = [...variables.stack];
                        getEdge(currId, neighbor.node).state = 'active';
                        edges = [...edges];
                        yield;
                    }
                }
            }
        }
        finish();
    }

    function* dijkstraGenerator(startId) {
        activeOperation = 'dijkstra';
        nodes.forEach(n => n.distance = Infinity);
        getNode(startId).distance = 0;
        variables.priorityQueue = [{ id: startId, d: 0 }];
        while (variables.priorityQueue.length > 0) {
            variables.priorityQueue.sort((a, b) => a.d - b.d);
            variables.priorityQueue = [...variables.priorityQueue];
            yield;
            let { id: currId, d: currD } = variables.priorityQueue.shift();
            variables.current = currId;
            if (currD > getNode(currId).distance) continue;
            getNode(currId).state = 'visited';
            nodes = [...nodes];
            traversalResult = [...traversalResult, `${currId}(${currD})`];
            yield;
            for (let neighbor of adjList[currId]) {
                let edge = getEdge(currId, neighbor.node);
                edge.state = 'active'; edges = [...edges];
                let newDist = currD + neighbor.weight;
                if (newDist < getNode(neighbor.node).distance) {
                    getNode(neighbor.node).distance = newDist;
                    variables.priorityQueue.push({ id: neighbor.node, d: newDist });
                    variables.priorityQueue = [...variables.priorityQueue];
                    edge.state = 'visited'; edges = [...edges];
                    yield;
                } else {
                    edge.state = 'default'; edges = [...edges];
                }
            }
        }
        finish();
    }

    function* primGenerator(startId) {
        activeOperation = 'prim';
        let visited = new Set([startId]);
        getNode(startId).state = 'visited';
        nodes = [...nodes];
        
        variables.priorityQueue = [];
        adjList[startId].forEach(n => variables.priorityQueue.push({ u: startId, v: n.node, weight: n.weight }));
        variables.priorityQueue.sort((a, b) => a.weight - b.weight);
        variables.priorityQueue = [...variables.priorityQueue];
        
        activeLine = 0; yield;

        while (variables.priorityQueue.length > 0 && visited.size < nodes.length) {
            variables.priorityQueue.sort((a, b) => a.weight - b.weight);
            variables.priorityQueue = [...variables.priorityQueue];
            activeLine = 1; yield;
            
            let edgeData = variables.priorityQueue.shift();
            variables.priorityQueue = [...variables.priorityQueue];
            variables.current = edgeData.v;
            
            if (visited.has(edgeData.v)) {
                log(`Skipping ${edgeData.u}-${edgeData.v}, ${edgeData.v} already visited`, 'warning');
                continue;
            }
            
            activeLine = 4;
            visited.add(edgeData.v);
            variables.mstWeight += edgeData.weight;
            getNode(edgeData.v).state = 'visited';
            getEdge(edgeData.u, edgeData.v).state = 'visited';
            edges = [...edges]; nodes = [...nodes];
            traversalResult = [...traversalResult, `${edgeData.u}-${edgeData.v}`];
            log(`Added ${edgeData.u}-${edgeData.v} (wt: ${edgeData.weight}) to MST`, 'success');
            yield;
            
            activeLine = 5;
            adjList[edgeData.v].forEach(n => {
                if (!visited.has(n.node)) variables.priorityQueue.push({ u: edgeData.v, v: n.node, weight: n.weight });
            });
            variables.priorityQueue.sort((a, b) => a.weight - b.weight);
            variables.priorityQueue = [...variables.priorityQueue];
            yield;
        }
        statusMessage = `Prim's MST Complete. Total Weight: ${variables.mstWeight}`;
        finish();
    }

    function* kruskalGenerator() {
        activeOperation = 'kruskal';
        activeLine = 0;
        variables.priorityQueue = [...edges].sort((a, b) => a.weight - b.weight);
        log("Initial Priority Queue created with all edges sorted.", "info");
        
        parentDSU = {};
        nodes.forEach(n => parentDSU[n.id] = n.id);
        yield;

        while (variables.priorityQueue.length > 0) {
            activeLine = 1;
            let edge = variables.priorityQueue.shift();
            variables.priorityQueue = [...variables.priorityQueue];
            edge.state = 'active';
            edges = [...edges];
            log(`Checking edge ${edge.u}-${edge.v}`, 'info');
            yield;

            activeLine = 2;
            let rootU = find(edge.u);
            let rootV = find(edge.v);
            yield;

            if (rootU !== rootV) {
                activeLine = 4;
                union(edge.u, edge.v);
                variables.mstWeight += edge.weight;
                edge.state = 'visited';
                getNode(edge.u).state = 'visited';
                getNode(edge.v).state = 'visited';
                traversalResult = [...traversalResult, `${edge.u}-${edge.v}`];
                edges = [...edges]; nodes = [...nodes];
                log(`Accepted edge (wt: ${edge.weight}). Total MST Weight: ${variables.mstWeight}`, 'success');
                yield;
            } else {
                edge.state = 'failed';
                edges = [...edges];
                activeLine = 5;
                log(`Rejected edge ${edge.u}-${edge.v} (Cycle detected)`, 'danger');
                yield;
                edge.state = 'default';
                edges = [...edges];
            }
        }
        statusMessage = `Kruskal's MST Complete. Total Weight: ${variables.mstWeight}`;
        finish();
    }

    function runOperation(genFn) {
        resetTrace();
        currentGenerator = genFn === kruskalGenerator ? kruskalGenerator() : genFn(startNodeId);
        runAuto();
    }

    function runAuto() {
        if (!currentGenerator) return;
        const result = currentGenerator.next();
        if (!result.done) timeoutId = setTimeout(runAuto, speed);
        else finish();
    }

    function resetTrace() {
        if (timeoutId) clearTimeout(timeoutId);
        currentGenerator = null;
        activeLine = -1;
        traversalResult = [];
        statusMessage = '';
        initGraph();
    }

    function finish() {
        currentGenerator = null;
        activeLine = -1;
    }

    onMount(initGraph);
</script>

<div class="visualizer-page">
    <header>
        <h1>Graph Visualizer</h1>
        <p>Traversals, Dijkstra, and Minimum Spanning Trees</p>
    </header>

    <section class="controls">
        <div class="control-group">
            <label for="start">Start Node</label>
            <select id="start" bind:value={startNodeId}>
                {#each INITIAL_NODES as node}<option value={node.id}>{node.id}</option>{/each}
            </select>
        </div>
        <div class="actions">
            <button class="btn primary" on:click={() => runOperation(bfsGenerator)}>BFS</button>
            <button class="btn primary" on:click={() => runOperation(dfsGenerator)}>DFS</button>
            <button class="btn warning" on:click={() => runOperation(dijkstraGenerator)}>Dijkstra</button>
            <button class="btn warning" on:click={() => runOperation(primGenerator)}>Prim's</button>
            <button class="btn warning" on:click={() => runOperation(kruskalGenerator)}>Kruskal's</button>
            <button class="btn danger" on:click={resetTrace}>Reset</button>
        </div>
        <div class="control-group">
            <label for="speed">Speed</label>
            <input type="range" id="speed" min="100" max="2000" step="100" bind:value={speed} dir="rtl">
        </div>
    </section>

    <div class="main-content">
        <section class="left-pane">
            <div class="code-panel">
                <h3>{activeOperation ? activeOperation.toUpperCase() : 'Algorithm'}</h3>
                <div class="code-display">
                    {#if activeOperation}
                        {#each ALGO_CODE[activeOperation] as line, i}
                            <div class="code-line" class:active={activeLine === i}>
                                <span class="line-number">{i + 1}</span>
                                <pre>{line}</pre>
                            </div>
                        {/each}
                    {:else}
                        <p style="color: #636e72">Start an operation.</p>
                    {/if}
                </div>
            </div>

            <div class="state-panel">
                {#if ['prim', 'kruskal'].includes(activeOperation)}
                    <div class="weight-display">
                        <span>MST Total Weight: </span>
                        <span class="weight-val">{variables.mstWeight}</span>
                    </div>
                {/if}
                
                <h3>
                    {#if activeOperation === 'bfs'}Queue (FIFO)
                    {:else if activeOperation === 'dfs'}Stack (LIFO)
                    {:else}Data Structure State
                    {/if}
                </h3>

                <div class="pq-display">
                    {#if activeOperation === 'bfs'}
                        {#each variables.queue as id}
                            <div class="pq-item">
                                <span class="pq-label">Node</span>
                                <span class="pq-val">{id}</span>
                            </div>
                        {/each}
                    {:else if activeOperation === 'dfs'}
                        {#each [...variables.stack].reverse() as id}
                            <div class="pq-item">
                                <span class="pq-label">Node</span>
                                <span class="pq-val">{id}</span>
                            </div>
                        {/each}
                    {:else if variables.priorityQueue.length > 0}
                        {#each variables.priorityQueue as item}
                            <div class="pq-item">
                                {#if item.u}
                                    <span class="pq-label">{item.u}-{item.v}</span>
                                    <span class="pq-val">wt: {item.weight}</span>
                                {:else}
                                    <span class="pq-label">Node {item.id}</span>
                                    <span class="pq-val">dist: {item.d === Infinity ? '∞' : item.d}</span>
                                {/if}
                            </div>
                        {/each}
                    {:else}
                        <p style="color: #636e72; font-size: 0.75rem; text-align: center;">Empty</p>
                    {/if}
                </div>
            </div>
            
            <div class="data-panel">
                <div class="tabs">
                    <button class:active={showMatrix} on:click={() => showMatrix = true}>Matrix</button>
                    <button class:active={!showMatrix} on:click={() => showMatrix = false}>List</button>
                </div>
                <div class="data-display">
                    {#if showMatrix}
                        <table class="adj-matrix">
                            <tr><th></th>{#each INITIAL_NODES as n}<th>{n.id}</th>{/each}</tr>
                            {#each INITIAL_NODES as u}
                                <tr><th>{u.id}</th>{#each INITIAL_NODES as v}<td>{getEdge(u.id, v.id) ? getEdge(u.id, v.id).weight : '-'}</td>{/each}</tr>
                            {/each}
                        </table>
                    {:else}
                        {#each Object.entries(adjList) as [node, edges]}
                            <div class="adj-row"><span class="node-label">{node}</span> → {#each edges as edge, i}{edge.node}({edge.weight}){i < edges.length-1 ? ', ' : ''}{/each}</div>
                        {/each}
                    {/if}
                </div>
            </div>
        </section>

        <section class="visualizer-panel">
            <div class="graph-container">
                <svg width="800" height="350">
                    {#each edges as edge}
                        {@const u = getNode(edge.u)} {@const v = getNode(edge.v)}
                        <line x1={u.x} y1={u.y} x2={v.x} y2={v.y} class="edge {edge.state}" />
                        <rect x={(u.x+v.x)/2-10} y={(u.y+v.y)/2-10} width="20" height="20" rx="4" fill="white" stroke="#ced4da" />
                        <text x={(u.x+v.x)/2} y={(u.y+v.y)/2+4} text-anchor="middle" font-size="12" font-weight="bold" fill="#6c757d">{edge.weight}</text>
                    {/each}
                    {#each nodes as node}
                        <g class="node-group {node.state}">
                            <circle cx={node.x} cy={node.y} r="22" />
                            <text x={node.x} y={node.y + 5} text-anchor="middle">{node.id}</text>
                            {#if activeOperation === 'dijkstra'}<text class="dist-label" x={node.x} y={node.y - 30} text-anchor="middle">{node.distance === Infinity ? '∞' : node.distance}</text>{/if}
                        </g>
                    {/each}
                </svg>
                <div class="traversal-result">
                    <span class="label">Result Path/Edges:</span>
                    <div class="status-box">
                        {#if statusMessage}<span class="status-msg">{statusMessage}</span>{/if}
                        <div class="sequence">{#each traversalResult as val, i}<span class="seq-item">{val}</span>{i < traversalResult.length-1 ? ' , ' : ''}{/each}</div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <section class="log-section">
        <h3>Trace Logs</h3>
        <div class="log-container">{#each logs as entry}<div class="log-entry {entry.type}"><span class="time">[{entry.time}]</span> {entry.message}</div>{/each}</div>
    </section>
</div>

<style>
    .visualizer-page { display: flex; flex-direction: column; gap: 1rem; }
    header { text-align: center; }
    .controls { background: white; padding: 1rem; border-radius: 12px; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; justify-content: center; border: 1px solid #dee2e6; }
    .main-content { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1rem; }
    .left-pane { display: flex; flex-direction: column; gap: 1rem; }
    .code-panel, .state-panel, .data-panel, .log-section { background: #2d3436; color: #dfe6e9; border-radius: 12px; padding: 1rem; }
    .code-panel h3, .state-panel h3, .data-panel h3, .log-section h3 { color: #4a90e2; margin-bottom: 0.5rem; font-size: 0.8rem; text-transform: uppercase; }
    
    .code-line { display: flex; gap: 0.5rem; padding: 0.1rem 0.5rem; border-radius: 4px; }
    .code-line.active { background: rgba(74, 144, 226, 0.3); border-left: 3px solid #4a90e2; }
    pre { margin: 0; font-family: monospace; font-size: 0.75rem; }

    .state-panel { border-top: 2px solid #4a90e2; }
    .weight-display { font-weight: bold; margin-bottom: 0.75rem; font-size: 0.9rem; }
    .weight-val { color: #2ecc71; font-size: 1.1rem; }
    
    .pq-display { max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.25rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 6px; }
    .pq-item { display: flex; justify-content: space-between; font-size: 0.75rem; padding: 0.1rem 0.4rem; border-bottom: 1px solid #3d4446; }
    .pq-label { color: #f1c40f; }
    .pq-val { color: #2ecc71; font-weight: bold; }

    .tabs { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
    .tabs button { background: none; border: 1px solid #636e72; color: #dfe6e9; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
    .tabs button.active { background: #4a90e2; color: white; }
    .data-display { overflow-x: auto; font-family: monospace; font-size: 0.8rem; }
    .adj-matrix { width: 100%; border-collapse: collapse; }
    .adj-matrix th, .adj-matrix td { border: 1px solid #636e72; padding: 0.2rem; }
    .adj-row { border-bottom: 1px dashed #636e72; padding: 0.1rem 0; }
    .node-label { color: #f1c40f; }

    .visualizer-panel { background: white; border-radius: 12px; padding: 1rem; border: 1px solid #dee2e6; display: flex; flex-direction: column; align-items: center; min-height: 520px; }
    .graph-container { width: 800px; }
    .edge { stroke: #ced4da; stroke-width: 3; transition: all 0.3s; }
    .edge.active { stroke: #f1c40f; stroke-width: 5; }
    .edge.visited { stroke: #2ecc71; stroke-width: 5; }
    .edge.failed { stroke: #e74c3c; stroke-width: 5; }
    .node-group circle { fill: white; stroke: #4a90e2; stroke-width: 3; transition: all 0.3s; }
    .node-group.visited circle { fill: #2ecc71; stroke: #27ae60; }
    .node-group text { font-weight: bold; font-size: 14px; fill: #2c3e50; }
    .node-group.visited text { fill: white; }
    .traversal-result { width: 100%; margin-top: 1rem; padding: 0.5rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6; font-size: 0.85rem; }
    .seq-item { background: #4a90e2; color: white; padding: 1px 6px; border-radius: 4px; font-weight: bold; }
    .btn { padding: 0.4rem 0.8rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
    .btn.primary { background: #4a90e2; color: white; }
    .btn.warning { background: #e67e22; color: white; }
    .btn.danger { background: #e74c3c; color: white; }
    .log-container { height: 80px; overflow-y: auto; font-size: 0.75rem; }
    .log-entry { border-left: 2px solid #4a90e2; padding-left: 0.5rem; margin-bottom: 0.2rem; }
    .log-entry.success { border-color: #2ecc71; }
    .log-entry.danger { border-color: #e74c3c; }
</style>
