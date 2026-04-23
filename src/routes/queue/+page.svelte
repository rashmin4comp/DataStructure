<script>
    import { onMount } from 'svelte';

    let queue = [];
    let logs = [];
    let variables = { front: -1, rear: -1, maxSize: 8 };
    let activeLine = -1;
    let activeOperation = '';
    let currentGenerator = null;
    let timeoutId = null;
    let speed = 500;
    let inputValue = '';

    const ALGO_CODE = {
        enqueue: [
            "if rear == maxSize - 1:",
            "  print 'Queue Overflow'",
            "else:",
            "  if front == -1: front = 0",
            "  rear = rear + 1",
            "  queue[rear] = value"
        ],
        dequeue: [
            "if front == -1 or front > rear:",
            "  print 'Queue Underflow'",
            "else:",
            "  value = queue[front]",
            "  front = front + 1",
            "  return value"
        ]
    };

    function log(message, type = '') {
        logs = [...logs, { message, type, time: new Date().toLocaleTimeString() }];
    }

    function* enqueueGenerator(val) {
        activeOperation = 'enqueue';
        activeLine = 0; yield;
        if (variables.rear >= variables.maxSize - 1) {
            activeLine = 1;
            log('Queue Overflow! Queue is full.', 'danger');
            yield;
            return;
        }
        activeLine = 2; yield;
        activeLine = 3;
        if (variables.front === -1) {
            variables.front = 0;
            log('Initializing front to 0', 'info');
            yield;
        }
        activeLine = 4;
        variables.rear++;
        log(`Incrementing rear to ${variables.rear}`, 'info');
        yield;

        activeLine = 5;
        queue[variables.rear] = val;
        queue = [...queue]; // trigger reactivity
        log(`Enqueued ${val} at position ${variables.rear}`, 'success');
        yield;
        finish();
    }

    function* dequeueGenerator() {
        activeOperation = 'dequeue';
        activeLine = 0; yield;
        if (variables.front === -1 || variables.front > variables.rear) {
            activeLine = 1;
            log('Queue Underflow! Queue is empty.', 'danger');
            yield;
            return;
        }
        activeLine = 2; yield;
        activeLine = 3;
        let val = queue[variables.front];
        log(`Reading front value: ${val}`, 'info');
        yield;

        activeLine = 4;
        let oldFront = variables.front;
        variables.front++;
        log(`Incrementing front to ${variables.front}`, 'info');
        yield;

        activeLine = 5;
        // In this simple visualization, we just "gray out" or remove the visual element
        log(`Dequeued ${val} from the queue`, 'warning');
        yield;
        finish();
    }

    function startEnqueue() {
        if (!inputValue) return;
        resetTrace();
        currentGenerator = enqueueGenerator(parseInt(inputValue));
        inputValue = '';
        runAuto();
    }

    function startDequeue() {
        resetTrace();
        currentGenerator = dequeueGenerator();
        runAuto();
    }

    function runAuto() {
        const result = currentGenerator.next();
        if (!result.done) {
            timeoutId = setTimeout(runAuto, speed);
        }
    }

    function step() {
        if (!currentGenerator) return;
        currentGenerator.next();
    }

    function finish() {
        currentGenerator = null;
        activeLine = -1;
    }

    function resetTrace() {
        if (timeoutId) clearTimeout(timeoutId);
        currentGenerator = null;
        activeLine = -1;
    }

    function clearQueue() {
        resetTrace();
        queue = [];
        variables.front = -1;
        variables.rear = -1;
        logs = [];
        log('Queue cleared.');
    }
</script>

<div class="visualizer-page">
    <header>
        <h1>Queue Visualizer</h1>
        <p>FIFO: First-In-First-Out Data Structure</p>
    </header>

    <section class="controls">
        <div class="control-group">
            <label for="val">Value</label>
            <input type="number" id="val" bind:value={inputValue} placeholder="e.g. 42" style="width: 80px;">
        </div>
        <div class="actions">
            <button class="btn primary" on:click={startEnqueue}>Enqueue</button>
            <button class="btn warning" on:click={startDequeue}>Dequeue</button>
            <button class="btn secondary" on:click={step} disabled={!currentGenerator}>Next Step</button>
            <button class="btn danger" on:click={clearQueue}>Clear</button>
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
                    <thead>
                        <tr><th>Variable</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                        <tr><td class="var-name">front</td><td class="var-value">{variables.front}</td></tr>
                        <tr><td class="var-name">rear</td><td class="var-value">{variables.rear}</td></tr>
                        <tr><td class="var-name">maxSize</td><td class="var-value">{variables.maxSize}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="visualizer-panel">
            <div class="queue-container">
                <div class="queue-line">
                    {#each Array(variables.maxSize).fill(0) as _, i}
                        {@const item = queue[i]}
                        {@const isOccupied = i >= variables.front && i <= variables.rear && variables.front !== -1}
                        <div class="queue-slot" class:occupied={isOccupied}>
                            {#if isOccupied && item !== undefined}
                                <div class="queue-item">
                                    {item}
                                </div>
                            {/if}
                            <div class="slot-index">{i}</div>
                            
                            <div class="pointers">
                                {#if variables.front === i}
                                    <span class="pointer front">FRONT</span>
                                {/if}
                                {#if variables.rear === i}
                                    <span class="pointer rear">REAR</span>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
                <div class="labels">
                    <span>EXIT ←</span>
                    <span style="flex-grow: 1"></span>
                    <span>← ENTRANCE</span>
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
            {#if logs.length === 0}
                <div class="log-entry">Perform Enqueue or Dequeue to see the trace.</div>
            {/if}
        </div>
    </section>
</div>

<style>
    .visualizer-page { display: flex; flex-direction: column; gap: 2rem; }
    header { text-align: center; }
    header h1 { color: #4a90e2; }

    .controls {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        align-items: flex-end;
        justify-content: center;
        border: 1px solid #dee2e6;
    }

    .main-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        min-height: 500px;
    }

    .left-pane { display: flex; flex-direction: column; gap: 1.5rem; }

    .code-panel, .variable-panel {
        background: #2d3436;
        color: #dfe6e9;
        border-radius: 12px;
        padding: 1.5rem;
    }

    .code-panel h3, .variable-panel h3 { color: #4a90e2; margin-bottom: 1rem; font-size: 0.9rem; text-transform: uppercase; }

    .code-line { display: flex; gap: 1rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .code-line.active { background: rgba(74, 144, 226, 0.3); border-left: 3px solid #4a90e2; }
    .line-number { color: #636e72; min-width: 1rem; }
    pre { margin: 0; font-family: 'Fira Code', monospace; font-size: 0.85rem; }

    .variable-table { width: 100%; border-collapse: collapse; }
    .variable-table td, .variable-table th { padding: 0.5rem; text-align: left; border-bottom: 1px solid #636e72; }
    .var-name { color: #f1c40f; }
    .var-value { color: #2ecc71; font-family: monospace; }

    .visualizer-panel {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border: 1px solid #dee2e6;
    }

    .queue-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .queue-line {
        display: flex;
        gap: 8px;
        justify-content: center;
        padding: 2rem 0;
    }

    .queue-slot {
        width: 60px;
        height: 60px;
        background: #f8f9fa;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
    }

    .queue-slot.occupied { background: rgba(74, 144, 226, 0.1); border-color: #4a90e2; }

    .queue-item {
        background: #4a90e2;
        color: white;
        width: 80%;
        height: 80%;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 6px;
        font-weight: bold;
        animation: enqueueAnim 0.3s ease-out;
    }

    @keyframes enqueueAnim { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .slot-index { position: absolute; top: -25px; color: #ced4da; font-size: 0.8rem; }

    .pointers {
        position: absolute;
        bottom: -50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .pointer {
        font-size: 0.7rem;
        font-weight: bold;
        padding: 2px 5px;
        border-radius: 4px;
        color: white;
    }

    .pointer.front { background: #e74c3c; }
    .pointer.rear { background: #2ecc71; }

    .labels { display: flex; font-weight: bold; color: #636e72; font-size: 0.9rem; padding: 0 1rem; }

    .btn { padding: 0.6rem 1.2rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn.primary { background: #4a90e2; color: white; }
    .btn.warning { background: #e67e22; color: white; }
    .btn.danger { background: #e74c3c; color: white; }
    .btn.secondary { background: #6c757d; color: white; }
    .btn:disabled { opacity: 0.5; }

    .log-section { background: #2d3436; color: #dfe6e9; padding: 1.5rem; border-radius: 12px; }
    .log-container { height: 100px; overflow-y: auto; font-size: 0.85rem; }
    .log-entry { border-left: 2px solid #4a90e2; padding-left: 0.5rem; margin-bottom: 0.2rem; }
    .log-entry.success { border-color: #2ecc71; }
    .log-entry.warning { border-color: #e67e22; }
    .log-entry.danger { border-color: #e74c3c; }
</style>
