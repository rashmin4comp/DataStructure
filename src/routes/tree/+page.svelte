<script>
    import { onMount } from 'svelte';

    let root = null;
    let logs = [];
    let variables = { current: null, val: null, successor: null };
    let activeLine = -1;
    let activeOperation = '';
    let currentGenerator = null;
    let timeoutId = null;
    let speed = 600;
    let inputValue = '';
    let traversalResult = [];
    let statusMessage = '';
    
    // Visualization state
    let nodes = []; // { x, y, value, id, left, right, highlight }
    let edges = []; // { x1, y1, x2, y2 }

    const ALGO_CODE = {
        insertBST: [
            "if root == null:",
            "  root = new Node(val)",
            "else:",
            "  curr = root",
            "  while curr != null:",
            "    if val < curr.val: go left",
            "    else: go right"
        ],
        searchBST: [
            "curr = root",
            "while curr != null:",
            "  if val == curr.val: return FOUND",
            "  if val < curr.val: curr = curr.left",
            "  else: curr = curr.right",
            "return NOT_FOUND"
        ],
        deleteBST: [
            "node = findNode(val)",
            "if node is leaf: remove it",
            "else if node has one child: link child to parent",
            "else (two children):",
            "  succ = findMin(node.right)",
            "  node.val = succ.val",
            "  delete succ from right subtree"
        ],
        traverse: [
            "function traverse(node):",
            "  if node == null: return",
            "  // PRE-ORDER: visit(node)",
            "  traverse(node.left)",
            "  // IN-ORDER: visit(node)",
            "  traverse(node.right)",
            "  // POST-ORDER: visit(node)"
        ]
    };

    function log(message, type = '') {
        logs = [...logs, { message, type, time: new Date().toLocaleTimeString() }];
    }

    // --- BST Logic ---
    function* insertBSTGenerator(val) {
        activeOperation = 'insertBST';
        variables.val = val;
        activeLine = 0; yield;
        if (!root) {
            activeLine = 1;
            root = { value: val, left: null, right: null, id: Math.random() };
            log(`Inserted root ${val}`, 'success');
            statusMessage = `Inserted Root: ${val}`;
            updateVisualization();
            yield;
        } else {
            activeLine = 3;
            let curr = root;
            updateVisualization(curr.id);
            yield;
            while (curr) {
                activeLine = 4; yield;
                if (val === curr.value) {
                    log('Value already exists', 'warning');
                    statusMessage = `Duplicate Value: ${val}`;
                    break;
                }
                if (val < curr.value) {
                    activeLine = 5; log(`Going left from ${curr.value}`, 'info'); yield;
                    if (!curr.left) {
                        activeLine = 7;
                        curr.left = { value: val, left: null, right: null, id: Math.random() };
                        log(`Inserted ${val} left of ${curr.value}`, 'success');
                        statusMessage = `Inserted: ${val}`;
                        updateVisualization(); yield; break;
                    }
                    curr = curr.left;
                } else {
                    activeLine = 6; log(`Going right from ${curr.value}`, 'info'); yield;
                    if (!curr.right) {
                        activeLine = 10;
                        curr.right = { value: val, left: null, right: null, id: Math.random() };
                        log(`Inserted ${val} right of ${curr.value}`, 'success');
                        statusMessage = `Inserted: ${val}`;
                        updateVisualization(); yield; break;
                    }
                    curr = curr.right;
                }
                updateVisualization(curr.id);
            }
        }
        finish();
    }

    function* searchBSTGenerator(val) {
        activeOperation = 'searchBST';
        activeLine = 0;
        let curr = root;
        log(`Searching for ${val}...`);
        updateVisualization(curr?.id);
        yield;
        while (curr) {
            activeLine = 1; yield;
            activeLine = 2;
            if (val === curr.value) {
                log(`Found ${val}!`, 'success');
                statusMessage = `Value ${val}: FOUND`;
                updateVisualization(curr.id);
                yield;
                finish(); return;
            }
            if (val < curr.value) {
                activeLine = 3; log(`${val} < ${curr.value}, checking left`, 'info'); yield;
                curr = curr.left;
            } else {
                activeLine = 4; log(`${val} > ${curr.value}, checking right`, 'info'); yield;
                curr = curr.right;
            }
            updateVisualization(curr?.id);
        }
        activeLine = 5;
        log(`${val} not found in tree`, 'danger');
        statusMessage = `Value ${val}: NOT FOUND`;
        yield;
        finish();
    }

    function* deleteBSTGenerator(val) {
        activeOperation = 'deleteBST';
        activeLine = 0;
        log(`Preparing to delete ${val}...`);
        yield;

        let parent = null;
        let curr = root;
        while (curr && curr.value !== val) {
            parent = curr;
            if (val < curr.value) curr = curr.left;
            else curr = curr.right;
            updateVisualization(curr?.id);
            yield;
        }

        if (!curr) {
            log(`Value ${val} not found`, 'danger');
            statusMessage = `Delete failed: ${val} not found`;
            finish(); return;
        }

        // Case 1 & 2: Leaf or one child
        if (!curr.left || !curr.right) {
            activeLine = 1;
            let child = curr.left ? curr.left : curr.right;
            log(`Removing node ${curr.value}`, 'warning');
            statusMessage = `Deleted: ${val}`;
            if (!parent) root = child;
            else if (parent.left === curr) parent.left = child;
            else parent.right = child;
            updateVisualization();
            yield;
        } 
        // Case 3: Two children
        else {
            activeLine = 3; yield;
            activeLine = 4;
            log('Node has two children. Finding inorder successor...', 'info');
            let succParent = curr;
            let succ = curr.right;
            updateVisualization(succ.id);
            yield;
            while (succ.left) {
                succParent = succ;
                succ = succ.left;
                updateVisualization(succ.id);
                yield;
            }
            activeLine = 5;
            log(`Replacing ${curr.value} with successor ${succ.value}`, 'info');
            statusMessage = `Deleted: ${val} (replaced by ${succ.value})`;
            curr.value = succ.value;
            updateVisualization(curr.id);
            yield;
            
            activeLine = 6;
            log('Deleting the successor node', 'warning');
            if (succParent.left === succ) succParent.left = succ.right;
            else succParent.right = succ.right;
            updateVisualization();
            yield;
        }
        finish();
    }

    function* inorderGenerator(node) {
        if (!node) return;
        activeOperation = 'traverse';
        yield* inorderGenerator(node.left);
        traversalResult = [...traversalResult, node.value];
        updateVisualization(node.id);
        yield;
        yield* inorderGenerator(node.right);
    }

    function* preorderGenerator(node) {
        if (!node) return;
        activeOperation = 'traverse';
        traversalResult = [...traversalResult, node.value];
        updateVisualization(node.id);
        yield;
        yield* preorderGenerator(node.left);
        yield* preorderGenerator(node.right);
    }

    function* postorderGenerator(node) {
        if (!node) return;
        activeOperation = 'traverse';
        yield* postorderGenerator(node.left);
        yield* postorderGenerator(node.right);
        traversalResult = [...traversalResult, node.value];
        updateVisualization(node.id);
        yield;
    }

    function updateVisualization(highlightId = null) {
        const newNodes = []; const newEdges = [];
        function traverse(node, x, y, offset) {
            if (!node) return;
            newNodes.push({ x, y, value: node.value, id: node.id, highlight: node.id === highlightId });
            if (node.left) {
                newEdges.push({ x1: x, y1: y, x2: x - offset, y2: y + 60 });
                traverse(node.left, x - offset, y + 60, offset / 2);
            }
            if (node.right) {
                newEdges.push({ x1: x, y1: y, x2: x + offset, y2: y + 60 });
                traverse(node.right, x + offset, y + 60, offset / 2);
            }
        }
        traverse(root, 400, 40, 150);
        nodes = newNodes; edges = newEdges;
    }

    function runOperation(gen) {
        resetTrace();
        currentGenerator = gen;
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
        updateVisualization();
    }

    function finish() {
        currentGenerator = null;
        activeLine = -1;
        updateVisualization();
    }

    function clearTree() {
        resetTrace();
        root = null;
        nodes = []; edges = []; logs = [];
        log('Tree cleared.');
    }
</script>

<div class="visualizer-page">
    <header>
        <h1>Tree Visualizer</h1>
        <p>BST: Search, Insert, and Delete</p>
    </header>

    <section class="controls">
        <div class="control-group">
            <label for="val">Val</label>
            <input type="number" id="val" bind:value={inputValue} style="width: 50px;">
        </div>
        <div class="actions">
            <button class="btn primary" on:click={() => runOperation(insertBSTGenerator(parseInt(inputValue)))}>Insert</button>
            <button class="btn warning" on:click={() => runOperation(searchBSTGenerator(parseInt(inputValue)))}>Search</button>
            <button class="btn danger" on:click={() => runOperation(deleteBSTGenerator(parseInt(inputValue)))}>Delete</button>
            <button class="btn secondary" on:click={() => {statusMessage='Pre-Order Traversal'; runOperation(preorderGenerator(root));}}>Pre</button>
            <button class="btn secondary" on:click={() => {statusMessage='In-Order Traversal'; runOperation(inorderGenerator(root));}}>In</button>
            <button class="btn secondary" on:click={() => {statusMessage='Post-Order Traversal'; runOperation(postorderGenerator(root));}}>Post</button>
            <button class="btn danger" on:click={clearTree}>Clear</button>
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
            <div class="variable-panel">
                <h3>Variables</h3>
                <table class="variable-table">
                    <tbody>
                        <tr><td>root</td><td class="var-value">{root ? root.value : 'null'}</td></tr>
                        <tr><td>target</td><td class="var-value">{inputValue || '-'}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="visualizer-panel">
            <div class="tree-container">
                <svg width="800" height="300">
                    {#each edges as edge}
                        <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="#ced4da" stroke-width="2" />
                    {/each}
                    {#each nodes as node}
                        <g class="node-group" class:highlight={node.highlight}>
                            <circle cx={node.x} cy={node.y} r="18" fill="white" stroke="#4a90e2" stroke-width="3" />
                            <text x={node.x} y={node.y + 5} text-anchor="middle" font-weight="bold" font-size="12">{node.value}</text>
                        </g>
                    {/each}
                </svg>
                <div class="traversal-result">
                    <span class="label">Result:</span>
                    <div class="status-box">
                        {#if statusMessage}
                            <span class="status-msg">{statusMessage}</span>
                        {/if}
                        <div class="sequence">
                            {#each traversalResult as val}
                                <span class="seq-item">{val}</span>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <section class="log-section">
        <h3>Execution Trace</h3>
        <div class="log-container">
            {#each logs as entry}
                <div class="log-entry {entry.type}">
                    <span class="time">[{entry.time}]</span> {entry.message}
                </div>
            {/each}
        </div>
    </section>
</div>

<style>
    .visualizer-page { display: flex; flex-direction: column; gap: 1.5rem; }
    header { text-align: center; }
    .controls { background: white; padding: 1rem; border-radius: 12px; display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; justify-content: center; border: 1px solid #dee2e6; }
    .main-content { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
    .left-pane { display: flex; flex-direction: column; gap: 1rem; }
    .code-panel, .variable-panel { background: #2d3436; color: #dfe6e9; border-radius: 12px; padding: 1rem; }
    .code-panel h3 { color: #4a90e2; margin-bottom: 0.5rem; font-size: 0.8rem; text-transform: uppercase; }
    .code-line { display: flex; gap: 0.5rem; padding: 0.1rem 0.5rem; border-radius: 4px; }
    .code-line.active { background: rgba(74, 144, 226, 0.3); border-left: 3px solid #4a90e2; }
    pre { margin: 0; font-family: monospace; font-size: 0.75rem; }
    .variable-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .variable-table td { padding: 0.2rem; border-bottom: 1px solid #636e72; }
    .var-value { color: #2ecc71; }
    .visualizer-panel { background: white; border-radius: 12px; padding: 1rem; height: 420px; border: 1px solid #dee2e6; overflow: auto; display: flex; flex-direction: column; align-items: center; }
    .tree-container { position: relative; width: 800px; }
    .traversal-result { width: 100%; margin-top: 1rem; padding: 0.5rem; background: #f8f9fa; border-radius: 8px; display: flex; align-items: flex-start; gap: 0.5rem; border: 1px solid #dee2e6; min-height: 50px; }
    .status-box { display: flex; flex-direction: column; gap: 0.25rem; }
    .status-msg { font-weight: bold; color: #2c3e50; font-size: 0.85rem; }
    .seq-item { background: #4a90e2; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; margin-right: 4px; display: inline-block; }
    .node-group circle { transition: all 0.3s; }
    .node-group.highlight circle { fill: #f1c40f; stroke: #e67e22; r: 22; }
    .btn { padding: 0.4rem 0.8rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
    .btn.primary { background: #4a90e2; color: white; }
    .btn.warning { background: #e67e22; color: white; }
    .btn.danger { background: #e74c3c; color: white; }
    .btn.secondary { background: #6c757d; color: white; }
    .log-section { background: #2d3436; color: #dfe6e9; padding: 1rem; border-radius: 12px; }
    .log-container { height: 70px; overflow-y: auto; font-size: 0.75rem; }
    .log-entry { border-left: 2px solid #4a90e2; padding-left: 0.5rem; margin-bottom: 0.2rem; }
</style>
