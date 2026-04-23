<script>
    import { onMount } from 'svelte';

    let stack = [];
    let logs = [];
    let variables = { top: -1, maxSize: 8 };
    let activeLine = -1;
    let activeOperation = '';
    let currentGenerator = null;
    let timeoutId = null;
    let speed = 500;
    let inputValue = '';

    const ALGO_CODE = {
        push: [
            "if top == maxSize - 1:",
            "  print 'Stack Overflow'",
            "else:",
            "  top = top + 1",
            "  stack[top] = value"
        ],
        pop: [
            "if top == -1:",
            "  print 'Stack Underflow'",
            "else:",
            "  value = stack[top]",
            "  top = top - 1",
            "  return value"
        ]
    };

    function log(message, type = '') {
        logs = [...logs, { message, type, time: new Date().toLocaleTimeString() }];
    }

    function* pushGenerator(val) {
        activeOperation = 'push';
        activeLine = 0; yield;
        if (stack.length >= variables.maxSize) {
            activeLine = 1;
            log('Stack Overflow! Cannot add more elements.', 'danger');
            yield;
            return;
        }
        activeLine = 2; yield;
        activeLine = 3;
        variables.top = stack.length;
        log(`Incrementing top to ${variables.top}`, 'info');
        yield;
        
        activeLine = 4;
        stack = [...stack, val];
        log(`Pushed ${val} onto the stack`, 'success');
        yield;
        finish();
    }

    function* popGenerator() {
        activeOperation = 'pop';
        activeLine = 0; yield;
        if (stack.length === 0) {
            activeLine = 1;
            log('Stack Underflow! Nothing to pop.', 'danger');
            yield;
            return;
        }
        activeLine = 2; yield;
        activeLine = 3;
        let val = stack[stack.length - 1];
        log(`Reading top value: ${val}`, 'info');
        yield;

        activeLine = 4;
        variables.top = stack.length - 2;
        log(`Decrementing top to ${variables.top}`, 'info');
        yield;

        activeLine = 5;
        stack = stack.slice(0, -1);
        log(`Popped ${val} from the stack`, 'warning');
        yield;
        finish();
    }

    function startPush() {
        if (!inputValue) return;
        resetTrace();
        currentGenerator = pushGenerator(parseInt(inputValue));
        inputValue = '';
        runAuto();
    }

    function startPop() {
        resetTrace();
        currentGenerator = popGenerator();
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

    function clearStack() {
        resetTrace();
        stack = [];
        variables.top = -1;
        logs = [];
        log('Stack cleared.');
    }
</script>

<div class="visualizer-page">
    <header>
        <h1>Stack Visualizer</h1>
        <p>LIFO: Last-In-First-Out Data Structure</p>
    </header>

    <section class="controls">
        <div class="control-group">
            <label for="val">Value</label>
            <input type="number" id="val" bind:value={inputValue} placeholder="e.g. 42" style="width: 80px;">
        </div>
        <div class="actions">
            <button class="btn primary" on:click={startPush}>Push</button>
            <button class="btn warning" on:click={startPop}>Pop</button>
            <button class="btn secondary" on:click={step} disabled={!currentGenerator}>Next Step</button>
            <button class="btn danger" on:click={clearStack}>Clear</button>
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
                        <tr><td class="var-name">top</td><td class="var-value">{variables.top}</td></tr>
                        <tr><td class="var-name">maxSize</td><td class="var-value">{variables.maxSize}</td></tr>
                        <tr><td class="var-name">currentSize</td><td class="var-value">{stack.length}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="visualizer-panel">
            <div class="stack-container">
                <div class="stack-frame">
                    {#each Array(variables.maxSize).fill(0) as _, i}
                        {@const index = variables.maxSize - 1 - i}
                        {@const item = stack[index]}
                        <div class="stack-slot" class:active={variables.top === index}>
                            {#if item !== undefined}
                                <div class="stack-item">
                                    {item}
                                    {#if variables.top === index}
                                        <span class="top-pointer">← TOP</span>
                                    {/if}
                                </div>
                            {:else}
                                <span class="slot-index">{index}</span>
                            {/if}
                        </div>
                    {/each}
                </div>
                <div class="stack-base"></div>
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
                <div class="log-entry">Perform Push or Pop to see the trace.</div>
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
        justify-content: center;
        align-items: center;
        border: 1px solid #dee2e6;
    }

    .stack-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 200px;
    }

    .stack-frame {
        width: 100%;
        border-left: 4px solid #636e72;
        border-right: 4px solid #636e72;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px;
    }

    .stack-base {
        width: 100%;
        height: 4px;
        background: #636e72;
    }

    .stack-slot {
        height: 40px;
        background: #f8f9fa;
        border: 1px dashed #dee2e6;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
    }

    .stack-slot.active { background: rgba(241, 196, 15, 0.1); }

    .stack-item {
        background: #4a90e2;
        color: white;
        width: 90%;
        height: 90%;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 4px;
        font-weight: bold;
        animation: pushAnim 0.3s ease-out;
    }

    @keyframes pushAnim { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .slot-index { color: #ced4da; font-size: 0.8rem; }
    .top-pointer { position: absolute; left: 105%; color: #e74c3c; font-weight: bold; white-space: nowrap; font-size: 0.8rem; }

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
