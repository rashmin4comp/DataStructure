<script>
    import { onMount } from 'svelte';

    let list = []; // Array of node objects { id, value }
    let type = 'singly'; // 'singly', 'doubly', 'circular'
    let logs = [];
    let variables = { head: null, tail: null, temp: null, i: null };
    let activeLine = -1;
    let activeOperation = '';
    let currentGenerator = null;
    let timeoutId = null;
    let speed = 500;
    let inputValue = '';
    let indexValue = '0';

    const ALGO_CODE = {
        insertHead: [
            "newNode = new Node(value)",
            "if head == null:",
            "  head = tail = newNode",
            "  if circular: newNode.next = head",
            "else:",
            "  newNode.next = head",
            "  if doubly: head.prev = newNode",
            "  head = newNode",
            "  if circular: tail.next = head"
        ],
        insertLast: [
            "newNode = new Node(value)",
            "if head == null:",
            "  head = tail = newNode",
            "else:",
            "  tail.next = newNode",
            "  if doubly: newNode.prev = tail",
            "  tail = newNode",
            "if circular: tail.next = head"
        ],
        insertAt: [
            "newNode = new Node(value)",
            "if pos == 0: return insertHead(value)",
            "temp = head",
            "for i from 0 to pos-1: temp = temp.next",
            "newNode.next = temp.next",
            "if doubly and temp.next: temp.next.prev = newNode",
            "temp.next = newNode",
            "if doubly: newNode.prev = temp"
        ],
        deleteHead: [
            "if head == null: return",
            "if head == tail:",
            "  head = tail = null",
            "else:",
            "  temp = head",
            "  head = head.next",
            "  if doubly: head.prev = null",
            "  if circular: tail.next = head"
        ]
    };

    function log(message, type = '') {
        logs = [...logs, { message, type, time: new Date().toLocaleTimeString() }];
    }

    function* insertHeadGenerator(val) {
        activeOperation = 'insertHead';
        activeLine = 0;
        let newNode = { id: Math.random(), value: val };
        log(`Created new node with value ${val}`, 'info');
        yield;

        activeLine = 1; yield;
        if (list.length === 0) {
            activeLine = 2;
            list = [newNode];
            variables.head = 0;
            variables.tail = 0;
            log('List empty, node is now head and tail', 'success');
            yield;
            if (type === 'circular') {
                activeLine = 3;
                log('Circular: Setting node.next to head', 'info');
                yield;
            }
        } else {
            activeLine = 4; yield;
            activeLine = 5;
            log('Linking new node.next to head', 'info');
            yield;
            if (type === 'doubly') {
                activeLine = 6;
                log('Doubly: Setting head.prev to new node', 'info');
                yield;
            }
            activeLine = 7;
            list = [newNode, ...list];
            variables.head = 0;
            variables.tail = list.length - 1;
            log('Updating head pointer', 'success');
            yield;
            if (type === 'circular') {
                activeLine = 8;
                log('Circular: Linking tail.next to new head', 'info');
                yield;
            }
        }
        finish();
    }

    function* insertLastGenerator(val) {
        activeOperation = 'insertLast';
        activeLine = 0;
        let newNode = { id: Math.random(), value: val };
        log(`Created new node with value ${val}`, 'info');
        yield;

        activeLine = 1; yield;
        if (list.length === 0) {
            activeLine = 2;
            list = [newNode];
            variables.head = 0;
            variables.tail = 0;
            log('List empty, node is head and tail', 'success');
            yield;
        } else {
            activeLine = 3; yield;
            activeLine = 4;
            log('Linking tail.next to new node', 'info');
            yield;
            if (type === 'doubly') {
                activeLine = 5;
                log('Doubly: Setting newNode.prev to tail', 'info');
                yield;
            }
            activeLine = 6;
            list = [...list, newNode];
            variables.tail = list.length - 1;
            log('Updating tail pointer', 'success');
            yield;
        }
        if (type === 'circular') {
            activeLine = 7;
            log('Circular: Linking tail.next to head', 'info');
            yield;
        }
        finish();
    }

    function* insertAtGenerator(val, pos) {
        if (pos <= 0) {
            yield* insertHeadGenerator(val);
            return;
        }
        if (pos >= list.length) {
            yield* insertLastGenerator(val);
            return;
        }

        activeOperation = 'insertAt';
        activeLine = 0;
        let newNode = { id: Math.random(), value: val };
        log(`Created new node ${val}`, 'info');
        yield;

        activeLine = 1; yield;
        activeLine = 2;
        variables.temp = 0;
        log('Initializing temp to head', 'info');
        yield;

        activeLine = 3;
        for (let i = 0; i < pos - 1; i++) {
            variables.i = i;
            variables.temp = i + 1;
            log(`Moving temp to index ${variables.temp}`, 'info');
            yield;
        }

        activeLine = 4;
        log('Linking newNode.next to temp.next', 'info');
        yield;

        if (type === 'doubly') {
            activeLine = 5;
            log('Doubly: Setting temp.next.prev to newNode', 'info');
            yield;
        }

        activeLine = 6;
        let newList = [...list];
        newList.splice(pos, 0, newNode);
        list = newList;
        log(`Inserted node at index ${pos}`, 'success');
        yield;

        if (type === 'doubly') {
            activeLine = 7;
            log('Doubly: Setting newNode.prev to temp', 'info');
            yield;
        }
        finish();
    }

    function* deleteHeadGenerator() {
        activeOperation = 'deleteHead';
        activeLine = 0; yield;
        if (list.length === 0) {
            log('Empty list!', 'danger');
            return;
        }

        activeLine = 1; yield;
        if (list.length === 1) {
            activeLine = 2;
            list = [];
            variables.head = null;
            variables.tail = null;
            log('Cleared the last node', 'warning');
            yield;
        } else {
            activeLine = 3; yield;
            activeLine = 4;
            log('Storing head in temp', 'info');
            yield;
            activeLine = 5;
            list = list.slice(1);
            variables.head = 0;
            log('Updating head pointer', 'success');
            yield;
            if (type === 'doubly') {
                activeLine = 6;
                log('Doubly: head.prev = null', 'info');
                yield;
            }
            if (type === 'circular') {
                activeLine = 7;
                log('Circular: tail.next = new head', 'info');
                yield;
            }
        }
        finish();
    }

    function runOperation(gen) {
        resetTrace();
        currentGenerator = gen;
        runAuto();
    }

    function runAuto() {
        if (!currentGenerator) return;
        const result = currentGenerator.next();
        if (!result.done) {
            timeoutId = setTimeout(runAuto, speed);
        }
    }

    function resetTrace() {
        if (timeoutId) clearTimeout(timeoutId);
        currentGenerator = null;
        activeLine = -1;
        variables.temp = null;
        variables.i = null;
    }

    function finish() {
        currentGenerator = null;
        activeLine = -1;
        variables.temp = null;
        variables.i = null;
    }

    function clearList() {
        resetTrace();
        list = [];
        variables = { head: null, tail: null, temp: null, i: null };
        logs = [];
        log('List cleared.');
    }
</script>

<div class="visualizer-page">
    <header>
        <h1>Linked List Visualizer</h1>
        <div class="type-selector">
            <button class:active={type === 'singly'} on:click={() => {type = 'singly'; clearList();}}>Singly</button>
            <button class:active={type === 'doubly'} on:click={() => {type = 'doubly'; clearList();}}>Doubly</button>
            <button class:active={type === 'circular'} on:click={() => {type = 'circular'; clearList();}}>Circular</button>
        </div>
    </header>

    <section class="controls">
        <div class="control-group">
            <label for="val">Val</label>
            <input type="number" id="val" bind:value={inputValue} placeholder="Val" style="width: 50px;">
        </div>
        <div class="control-group">
            <label for="idx">Idx</label>
            <input type="number" id="idx" bind:value={indexValue} min="0" placeholder="Idx" style="width: 50px;">
        </div>
        <div class="actions">
            <button class="btn primary" on:click={() => runOperation(insertHeadGenerator(parseInt(inputValue)))}>+ Head</button>
            <button class="btn primary" on:click={() => runOperation(insertAtGenerator(parseInt(inputValue), parseInt(indexValue)))}>+ At</button>
            <button class="btn primary" on:click={() => runOperation(insertLastGenerator(parseInt(inputValue)))}>+ Last</button>
            <button class="btn warning" on:click={() => runOperation(deleteHeadGenerator())}>Del Head</button>
            <button class="btn danger" on:click={clearList}>Clear</button>
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
                        <p style="color: #636e72">Perform an operation to see the code trace.</p>
                    {/if}
                </div>
            </div>

            <div class="variable-panel">
                <h3>Variables</h3>
                <table class="variable-table">
                    <thead><tr><th>Var</th><th>Value</th></tr></thead>
                    <tbody>
                        <tr><td>head</td><td>{list.length > 0 ? '0' : 'null'}</td></tr>
                        <tr><td>tail</td><td>{list.length > 0 ? (list.length - 1) : 'null'}</td></tr>
                        {#if variables.temp !== null}<tr><td class="var-name">temp</td><td class="var-value">{variables.temp}</td></tr>{/if}
                        {#if variables.i !== null}<tr><td class="var-name">i</td><td class="var-value">{variables.i}</td></tr>{/if}
                    </tbody>
                </table>
            </div>
        </section>

        <section class="visualizer-panel">
            <div class="list-container">
                {#each list as node, i}
                    <div class="node-wrapper" class:highlight={variables.temp === i}>
                        <div class="node" id="node-{i}">
                            <div class="node-val">{node.value}</div>
                            <div class="node-next">NEXT</div>
                            {#if type === 'doubly'}
                                <div class="node-prev">PREV</div>
                            {/if}
                        </div>
                        
                        {#if i < list.length - 1}
                            <div class="arrow">
                                <span>→</span>
                                {#if type === 'doubly'}
                                    <span class="back-arrow">←</span>
                                {/if}
                            </div>
                        {:else if type === 'circular' && list.length > 1}
                            <div class="circular-arrow">
                                <div class="curve"></div>
                                <span>↴</span>
                            </div>
                        {/if}

                        <div class="node-labels">
                            {#if i === 0} <span class="label head">HEAD</span> {/if}
                            {#if i === list.length - 1} <span class="label tail">TAIL</span> {/if}
                            {#if variables.temp === i} <span class="label temp">TEMP</span> {/if}
                        </div>
                        <div class="node-index">{i}</div>
                    </div>
                {/each}
                {#if list.length === 0}
                    <div class="empty-msg">List is empty</div>
                {/if}
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
    .visualizer-page { display: flex; flex-direction: column; gap: 2rem; }
    header { text-align: center; }
    header h1 { color: #4a90e2; margin-bottom: 1rem; }

    .type-selector { display: flex; justify-content: center; gap: 1rem; }
    .type-selector button {
        padding: 0.5rem 1.5rem;
        border: 1px solid #4a90e2;
        background: white;
        color: #4a90e2;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .type-selector button.active { background: #4a90e2; color: white; }

    .controls {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-end;
        justify-content: center;
        border: 1px solid #dee2e6;
    }

    .main-content { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; }

    .left-pane { display: flex; flex-direction: column; gap: 1.5rem; }
    .code-panel, .variable-panel { background: #2d3436; color: #dfe6e9; border-radius: 12px; padding: 1.2rem; }
    .code-panel h3 { color: #4a90e2; margin-bottom: 0.8rem; font-size: 0.9rem; text-transform: uppercase; }

    .code-line { display: flex; gap: 1rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .code-line.active { background: rgba(74, 144, 226, 0.3); border-left: 3px solid #4a90e2; }
    pre { margin: 0; font-family: 'Fira Code', monospace; font-size: 0.75rem; }

    .variable-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .variable-table td { padding: 0.3rem; border-bottom: 1px solid #636e72; }
    .var-name { color: #f1c40f; }
    .var-value { color: #2ecc71; }

    .visualizer-panel {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        min-height: 350px;
        display: flex;
        align-items: center;
        overflow-x: auto;
        border: 1px solid #dee2e6;
    }

    .list-container { display: flex; align-items: center; gap: 0; padding: 3rem 1rem; }

    .node-wrapper { display: flex; align-items: center; position: relative; transition: all 0.3s; }
    .node-wrapper.highlight { transform: scale(1.1); }

    .node {
        width: 70px;
        border: 2px solid #2c3e50;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        background: #f8f9fa;
        overflow: hidden;
    }

    .node-val { padding: 0.4rem; text-align: center; font-weight: bold; border-bottom: 1px solid #dee2e6; }
    .node-next, .node-prev { font-size: 0.55rem; text-align: center; background: #e9ecef; color: #6c757d; padding: 1px; }

    .arrow { display: flex; flex-direction: column; align-items: center; width: 35px; font-size: 1.2rem; color: #4a90e2; font-weight: bold; }
    .back-arrow { margin-top: -12px; }

    .circular-arrow { position: absolute; right: -15px; top: -50px; }
    .circular-arrow .curve {
        width: 120px;
        height: 50px;
        border: 2px solid #4a90e2;
        border-bottom: none;
        border-radius: 60px 60px 0 0;
        position: absolute;
        right: 40px;
    }

    .node-labels { position: absolute; top: -35px; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .label { font-size: 0.6rem; font-weight: bold; padding: 1px 4px; border-radius: 3px; color: white; }
    .label.head { background: #e74c3c; }
    .label.tail { background: #2ecc71; }
    .label.temp { background: #f1c40f; color: #2c3e50; }

    .node-index { position: absolute; bottom: -25px; width: 100%; text-align: center; font-size: 0.7rem; color: #adb5bd; }

    .empty-msg { color: #ced4da; font-style: italic; width: 100%; text-align: center; }

    .btn { padding: 0.5rem 0.8rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
    .btn.primary { background: #4a90e2; color: white; }
    .btn.warning { background: #e67e22; color: white; }
    .btn.danger { background: #e74c3c; color: white; }

    .log-section { background: #2d3436; color: #dfe6e9; padding: 1rem; border-radius: 12px; }
    .log-container { height: 100px; overflow-y: auto; font-size: 0.8rem; }
    .log-entry { border-left: 2px solid #4a90e2; padding-left: 0.5rem; margin-bottom: 0.2rem; }
</style>
