<script>
    import { onMount } from 'svelte';

    let array = [];
    let barStates = []; // 'default', 'compare', 'swap', 'sorted'
    let logs = [];
    let size = 20;
    let speed = 200;
    let algorithm = 'bubble';
    let isPlaying = false;
    let currentGenerator = null;
    let timeoutId = null;
    let activeLine = -1;
    let variables = {};

    const ALGO_CODE = {
        bubble: [
            "for i from 0 to n-1:",
            "  for j from 0 to n-i-1:",
            "    if array[j] > array[j+1]:",
            "      swap(array[j], array[j+1])"
        ],
        selection: [
            "for i from 0 to n-1:",
            "  minIdx = i",
            "  for j from i+1 to n:",
            "    if array[j] < array[minIdx]:",
            "      minIdx = j",
            "  swap(array[i], array[minIdx])"
        ],
        insertion: [
            "for i from 1 to n:",
            "  key = array[i]",
            "  j = i - 1",
            "  while j >= 0 and array[j] > key:",
            "    array[j+1] = array[j]",
            "    j--",
            "  array[j+1] = key"
        ],
        quick: [
            "pivot = array[high]",
            "i = low - 1",
            "for j from low to high-1:",
            "  if array[j] < pivot:",
            "    i++",
            "    swap(array[i], array[j])",
            "swap(array[i+1], array[high])"
        ]
    };

    $: maxVal = array.length > 0 ? Math.max(...array) : 100;

    function log(message, type = '') {
        logs = [...logs, { message, type, time: new Date().toLocaleTimeString() }];
    }

    function generateArray() {
        reset();
        array = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
        barStates = Array(size).fill('default');
        log(`Generated new array of size ${size}.`, 'info');
    }

    function reset() {
        isPlaying = false;
        currentGenerator = null;
        activeLine = -1;
        variables = {};
        if (timeoutId) clearTimeout(timeoutId);
        barStates = Array(array.length).fill('default');
        log('Visualizer reset.');
    }

    async function togglePlay() {
        if (isPlaying) {
            pause();
        } else {
            await play();
        }
    }

    function pause() {
        isPlaying = false;
        if (timeoutId) clearTimeout(timeoutId);
    }

    async function play() {
        isPlaying = true;
        if (!currentGenerator) {
            currentGenerator = getAlgorithmGenerator(algorithm);
            log(`Started ${algorithm} sort.`);
        }
        runAuto();
    }

    async function runAuto() {
        if (!isPlaying) return;
        const result = await step();
        if (!result.done) {
            timeoutId = setTimeout(runAuto, speed);
        } else {
            finish();
        }
    }

    async function step() {
        if (!currentGenerator) {
            currentGenerator = getAlgorithmGenerator(algorithm);
            log(`Stepping through ${algorithm} sort.`);
        }

        const result = currentGenerator.next();
        if (result.done) {
            finish();
        }
        array = [...array];
        barStates = [...barStates];
        variables = { ...variables };
        return result;
    }

    function finish() {
        isPlaying = false;
        currentGenerator = null;
        activeLine = -1;
        variables = {};
        barStates = Array(array.length).fill('sorted');
        log('Sorting complete!', 'success');
    }

    function getAlgorithmGenerator(name) {
        switch (name) {
            case 'bubble': return bubbleSort();
            case 'selection': return selectionSort();
            case 'insertion': return insertionSort();
            case 'quick': return quickSort(0, array.length - 1);
            default: return bubbleSort();
        }
    }

    // --- Algorithms with Code & Variable Tracing ---

    function* bubbleSort() {
        let n = array.length;
        variables = { n, i: 0, j: 0 };
        for (let i = 0; i < n; i++) {
            variables.i = i;
            activeLine = 0; yield;
            for (let j = 0; j < n - i - 1; j++) {
                variables.j = j;
                activeLine = 1; yield;
                barStates[j] = 'compare';
                barStates[j + 1] = 'compare';
                activeLine = 2;
                log(`Comparing ${array[j]} and ${array[j+1]}`);
                yield;

                if (array[j] > array[j + 1]) {
                    activeLine = 3;
                    log(`Swapping ${array[j]} and ${array[j+1]}`, 'warning');
                    [array[j], array[j + 1]] = [array[j + 1], array[j]];
                    barStates[j] = 'swap';
                    barStates[j + 1] = 'swap';
                    yield;
                }
                barStates[j] = 'default';
                barStates[j + 1] = 'default';
            }
            barStates[n - i - 1] = 'sorted';
        }
    }

    function* selectionSort() {
        let n = array.length;
        variables = { n, i: 0, j: 0, minIdx: 0 };
        for (let i = 0; i < n; i++) {
            variables.i = i;
            activeLine = 0; yield;
            let minIdx = i;
            variables.minIdx = minIdx;
            activeLine = 1; yield;
            barStates[i] = 'compare';
            for (let j = i + 1; j < n; j++) {
                variables.j = j;
                activeLine = 2; yield;
                barStates[j] = 'compare';
                activeLine = 3;
                log(`Checking if ${array[j]} < ${array[minIdx]}`);
                yield;
                if (array[j] < array[minIdx]) {
                    activeLine = 4;
                    if (minIdx !== i) barStates[minIdx] = 'default';
                    minIdx = j;
                    variables.minIdx = minIdx;
                    barStates[minIdx] = 'swap';
                    log(`New minimum found: ${array[minIdx]}`, 'info');
                    yield;
                } else {
                    barStates[j] = 'default';
                }
            }
            if (minIdx !== i) {
                activeLine = 5;
                log(`Swapping index ${i} with ${minIdx}`, 'warning');
                [array[i], array[minIdx]] = [array[minIdx], array[i]];
                barStates[i] = 'swap';
                barStates[minIdx] = 'swap';
                yield;
            }
            barStates[minIdx] = 'default';
            barStates[i] = 'sorted';
        }
    }

    function* insertionSort() {
        let n = array.length;
        variables = { n, i: 1, j: 0, key: 0 };
        barStates[0] = 'sorted';
        for (let i = 1; i < n; i++) {
            variables.i = i;
            activeLine = 0; yield;
            let key = array[i];
            variables.key = key;
            activeLine = 1; yield;
            let j = i - 1;
            variables.j = j;
            activeLine = 2; yield;
            barStates[i] = 'compare';
            log(`Inserting ${key} into sorted portion`);
            
            activeLine = 3; yield;
            while (j >= 0 && array[j] > key) {
                activeLine = 4;
                log(`${array[j]} > ${key}, shifting right`, 'info');
                array[j + 1] = array[j];
                barStates[j + 1] = 'swap';
                yield;
                barStates[j + 1] = 'sorted';
                activeLine = 5;
                j--;
                variables.j = j;
                yield;
                activeLine = 3; yield;
            }
            activeLine = 6;
            array[j + 1] = key;
            barStates[j + 1] = 'swap';
            log(`Placed ${key} at index ${j+1}`, 'success');
            yield;
            for(let k=0; k<=i; k++) barStates[k] = 'sorted';
        }
    }

    function* quickSort(start, end) {
        if (start >= end) {
            if (start >= 0 && start < array.length) barStates[start] = 'sorted';
            return;
        }
        let pivotIdx = yield* partition(start, end);
        yield* quickSort(start, pivotIdx - 1);
        yield* quickSort(pivotIdx + 1, end);
    }

    function* partition(start, end) {
        activeLine = 0;
        let pivot = array[end];
        variables.pivot = pivot;
        variables.low = start;
        variables.high = end;
        log(`Pivot selected: ${pivot} (index ${end})`, 'info');
        barStates[end] = 'swap';
        yield;

        activeLine = 1;
        let i = start - 1;
        variables.i = i;
        yield;

        for (let j = start; j < end; j++) {
            variables.j = j;
            activeLine = 2; yield;
            barStates[j] = 'compare';
            activeLine = 3;
            log(`Comparing ${array[j]} with pivot ${pivot}`);
            yield;
            if (array[j] < pivot) {
                activeLine = 4; yield;
                i++;
                variables.i = i;
                activeLine = 5;
                [array[i], array[j]] = [array[j], array[i]];
                barStates[i] = 'swap';
                barStates[j] = 'swap';
                log(`Swapping index ${i} and ${j} because ${array[j]} < pivot`, 'warning');
                yield;
                barStates[i] = 'default';
            }
            barStates[j] = 'default';
        }
        activeLine = 6;
        [array[i + 1], array[end]] = [array[end], array[i + 1]];
        barStates[i + 1] = 'swap';
        barStates[end] = 'swap';
        log(`Moving pivot to index ${i+1}`, 'success');
        yield;
        barStates[end] = 'default';
        barStates[i + 1] = 'sorted';
        return i + 1;
    }

    onMount(() => {
        generateArray();
    });
</script>

<div class="visualizer-page">
    <header>
        <h1>Sorting Visualizer</h1>
        <p>Explore algorithms with step-by-step trace and variable tracking.</p>
    </header>

    <section class="controls">
        <div class="control-group">
            <label for="algo">Algorithm</label>
            <select id="algo" bind:value={algorithm} on:change={reset}>
                <option value="bubble">Bubble Sort</option>
                <option value="selection">Selection Sort</option>
                <option value="insertion">Insertion Sort</option>
                <option value="quick">Quick Sort</option>
            </select>
        </div>

        <div class="control-group">
            <label for="size">Size: {size}</label>
            <input type="range" id="size" min="5" max="50" bind:value={size} on:input={generateArray}>
        </div>

        <div class="control-group">
            <label for="speed">Speed</label>
            <input type="range" id="speed" min="10" max="1000" step="10" bind:value={speed} dir="rtl">
        </div>

        <div class="actions">
            <button class="btn secondary" on:click={generateArray}>New Array</button>
            <button class="btn {isPlaying ? 'danger' : 'primary'}" on:click={togglePlay}>
                {isPlaying ? 'Pause' : (currentGenerator ? 'Resume' : 'Play')}
            </button>
            <button class="btn secondary" on:click={step} disabled={isPlaying}>Next Step</button>
            <button class="btn danger" on:click={reset}>Reset</button>
        </div>
    </section>

    <div class="main-content">
        <!-- Left Part: Algorithm Code & Variable Table -->
        <section class="left-pane">
            <div class="code-panel">
                <h3>Algorithm</h3>
                <div class="code-display">
                    {#each ALGO_CODE[algorithm] as line, i}
                        <div class="code-line" class:active={activeLine === i}>
                            <span class="line-number">{i + 1}</span>
                            <pre>{line}</pre>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="variable-panel">
                <h3>Variables</h3>
                <table class="variable-table">
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each Object.entries(variables) as [name, value]}
                            <tr>
                                <td class="var-name">{name}</td>
                                <td class="var-value">{value}</td>
                            </tr>
                        {/each}
                        {#if Object.keys(variables).length === 0}
                            <tr>
                                <td colspan="2" style="text-align: center; color: #636e72;">No variables active</td>
                            </tr>
                        {/if}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Right Part: Animation -->
        <section class="visualizer-panel">
            <div class="visualizer-container">
                <div class="array-container">
                    {#each array as val, i}
                        <div class="bar-wrapper">
                            <div 
                                class="bar {barStates[i]}" 
                                style="height: {(val / maxVal) * 100}%"
                            >
                                {#if array.length <= 25}
                                    <span class="bar-value">{val}</span>
                                {/if}
                            </div>
                            <div class="index-markers">
                                {#each Object.entries(variables) as [name, idx]}
                                    {#if idx === i && ['i', 'j', 'minIdx', 'pivotIdx', 'low', 'high'].includes(name)}
                                        <span class="marker {name}">{name}</span>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    {/each}
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
                <div class="log-entry">Welcome! Select an algorithm and click 'Play' or 'Next Step'.</div>
            {/if}
        </div>
    </section>
</div>

<style>
    .visualizer-page {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    header { text-align: center; }
    header h1 { color: var(--primary); margin-bottom: 0.5rem; }

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
        border: 1px solid var(--border);
    }

    .main-content {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 2rem;
        min-height: 500px;
    }

    .left-pane {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .code-panel, .variable-panel {
        background: #2d3436;
        color: #dfe6e9;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .code-panel h3, .variable-panel h3 {
        color: var(--primary);
        margin-bottom: 1rem;
        font-size: 0.9rem;
        text-transform: uppercase;
    }

    .code-display {
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        font-size: 0.85rem;
        line-height: 1.5;
    }

    .code-line {
        display: flex;
        gap: 1rem;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        transition: background 0.2s;
    }

    .code-line.active {
        background: rgba(74, 144, 226, 0.3);
        border-left: 3px solid var(--primary);
    }

    .line-number {
        color: #636e72;
        min-width: 1.5rem;
        text-align: right;
        user-select: none;
    }

    pre { margin: 0; white-space: pre-wrap; }

    .variable-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
    }

    .variable-table th, .variable-table td {
        padding: 0.5rem;
        text-align: left;
        border-bottom: 1px solid #636e72;
    }

    .var-name { color: #f1c40f; font-weight: bold; }
    .var-value { color: #2ecc71; font-family: monospace; }

    .visualizer-panel {
        display: flex;
        flex-direction: column;
    }

    .visualizer-container {
        background: white;
        border-radius: 12px;
        padding: 2rem 2rem 4rem 2rem;
        flex-grow: 1;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        border: 1px solid var(--border);
    }

    .array-container {
        display: flex;
        align-items: flex-end;
        gap: 4px;
        width: 100%;
        height: 250px;
    }

    .bar-wrapper {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        position: relative;
    }

    .bar {
        width: 100%;
        background-color: var(--bar-default);
        border-radius: 4px 4px 0 0;
        position: relative;
        transition: height 0.2s, background-color 0.2s;
    }

    .bar.compare { background-color: var(--bar-compare); }
    .bar.swap { background-color: var(--bar-swap); }
    .bar.sorted { background-color: var(--bar-sorted); }

    .bar-value {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.7rem;
        font-weight: bold;
    }

    .index-markers {
        position: absolute;
        bottom: -45px;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .marker {
        font-size: 0.6rem;
        font-weight: bold;
        padding: 1px 3px;
        border-radius: 3px;
        color: white;
        text-transform: uppercase;
    }

    .marker.i { background: #e74c3c; }
    .marker.j { background: #3498db; }
    .marker.minIdx { background: #f1c40f; color: #2c3e50; }
    .marker.pivot { background: #9b59b6; }
    .marker.low { background: #2ecc71; }
    .marker.high { background: #e67e22; }

    .log-section {
        background: #2d3436;
        color: #dfe6e9;
        padding: 1.5rem;
        border-radius: 12px;
        font-family: 'Courier New', Courier, monospace;
    }

    .log-section h3 {
        margin-bottom: 1rem;
        color: var(--primary);
        font-size: 0.9rem;
        text-transform: uppercase;
    }

    .log-container {
        height: 100px;
        overflow-y: auto;
        font-size: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .log-entry { border-left: 2px solid var(--primary); padding-left: 0.5rem; }
    .log-entry.info { border-color: #f1c40f; }
    .log-entry.success { border-color: #2ecc71; }
    .log-entry.warning { border-color: #e67e22; }
    .time { color: #636e72; font-size: 0.75rem; }

    @media (max-width: 1000px) {
        .main-content { grid-template-columns: 1fr; }
    }
</style>
