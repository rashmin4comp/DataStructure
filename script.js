/**
 * Sorting Algorithm Visualizer Logic
 */

class SortVisualizer {
    constructor() {
        this.array = [];
        this.container = document.getElementById('array-container');
        this.logContainer = document.getElementById('log-container');
        this.sizeInput = document.getElementById('array-size');
        this.sizeDisplay = document.getElementById('size-value');
        this.algorithmSelect = document.getElementById('algorithm-select');
        this.speedInput = document.getElementById('speed');
        
        this.playBtn = document.getElementById('start-sort');
        this.nextBtn = document.getElementById('next-step');
        this.resetBtn = document.getElementById('reset-sort');
        this.genBtn = document.getElementById('generate-array');

        this.isPlaying = false;
        this.isPaused = true;
        this.currentGenerator = null;
        this.timeoutId = null;

        this.init();
    }

    init() {
        this.sizeInput.addEventListener('input', () => {
            this.sizeDisplay.innerText = this.sizeInput.value;
            this.generateArray();
        });

        this.genBtn.addEventListener('click', () => this.generateArray());
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.nextBtn.addEventListener('click', () => this.step());
        this.resetBtn.addEventListener('click', () => this.reset());

        this.generateArray();
    }

    log(message, type = '') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logContainer.appendChild(entry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    generateArray() {
        this.reset();
        this.array = [];
        const size = parseInt(this.sizeInput.value);
        for (let i = 0; i < size; i++) {
            this.array.push(Math.floor(Math.random() * 90) + 10);
        }
        this.render();
        this.log(`Generated new array of size ${size}.`, 'info');
    }

    render() {
        this.container.innerHTML = '';
        const maxVal = Math.max(...this.array);
        this.array.forEach((val, idx) => {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${(val / maxVal) * 100}%`;
            
            const label = document.createElement('span');
            label.className = 'bar-value';
            label.innerText = val;
            
            if (this.array.length <= 25) {
                bar.appendChild(label);
            }
            
            bar.id = `bar-${idx}`;
            this.container.appendChild(bar);
        });
    }

    updateBar(idx, val, state = 'default') {
        const bar = document.getElementById(`bar-${idx}`);
        if (!bar) return;
        
        const maxVal = Math.max(...this.array);
        bar.style.height = `${(val / maxVal) * 100}%`;
        const label = bar.querySelector('.bar-value');
        if (label) label.innerText = val;

        // Reset colors then apply state
        bar.style.backgroundColor = '';
        if (state === 'compare') bar.style.backgroundColor = 'var(--bar-compare)';
        if (state === 'swap') bar.style.backgroundColor = 'var(--bar-swap)';
        if (state === 'sorted') bar.style.backgroundColor = 'var(--bar-sorted)';
    }

    async togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    pause() {
        this.isPlaying = false;
        this.playBtn.innerText = 'Resume';
        this.playBtn.classList.replace('danger', 'primary');
        clearTimeout(this.timeoutId);
    }

    async play() {
        this.isPlaying = true;
        this.playBtn.innerText = 'Pause';
        this.playBtn.classList.add('danger');
        
        if (!this.currentGenerator) {
            const algo = this.algorithmSelect.value;
            this.currentGenerator = this.getAlgorithmGenerator(algo);
            this.log(`Started ${algo} sort.`);
        }

        this.runAuto();
    }

    async runAuto() {
        if (!this.isPlaying) return;
        
        const result = await this.step();
        if (!result.done) {
            this.timeoutId = setTimeout(() => this.runAuto(), this.speedInput.value);
        } else {
            this.finish();
        }
    }

    async step() {
        if (!this.currentGenerator) {
            const algo = this.algorithmSelect.value;
            this.currentGenerator = this.getAlgorithmGenerator(algo);
            this.log(`Stepping through ${algo} sort.`);
        }

        const result = this.currentGenerator.next();
        if (result.done) {
            this.finish();
        }
        return result;
    }

    finish() {
        this.isPlaying = false;
        this.currentGenerator = null;
        this.playBtn.innerText = 'Play';
        this.playBtn.classList.remove('danger');
        this.log('Sorting complete!', 'success');
        
        // Final polish - color all bars sorted
        for (let i = 0; i < this.array.length; i++) {
            this.updateBar(i, this.array[i], 'sorted');
        }
    }

    reset() {
        this.isPlaying = false;
        this.currentGenerator = null;
        clearTimeout(this.timeoutId);
        this.playBtn.innerText = 'Play';
        this.playBtn.classList.remove('danger');
        this.render();
        this.log('Visualizer reset.');
    }

    getAlgorithmGenerator(name) {
        switch (name) {
            case 'bubble': return this.bubbleSort();
            case 'selection': return this.selectionSort();
            case 'insertion': return this.insertionSort();
            case 'quick': return this.quickSort(0, this.array.length - 1);
            default: return this.bubbleSort();
        }
    }

    *bubbleSort() {
        let n = this.array.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                this.updateBar(j, this.array[j], 'compare');
                this.updateBar(j + 1, this.array[j+1], 'compare');
                this.log(`Comparing ${this.array[j]} and ${this.array[j+1]}`);
                yield;

                if (this.array[j] > this.array[j + 1]) {
                    this.log(`Swapping ${this.array[j]} and ${this.array[j+1]}`, 'warning');
                    [this.array[j], this.array[j + 1]] = [this.array[j + 1], this.array[j]];
                    this.updateBar(j, this.array[j], 'swap');
                    this.updateBar(j + 1, this.array[j+1], 'swap');
                    yield;
                }
                this.updateBar(j, this.array[j]);
                this.updateBar(j + 1, this.array[j+1]);
            }
            this.updateBar(n - i - 1, this.array[n - i - 1], 'sorted');
        }
    }

    *selectionSort() {
        let n = this.array.length;
        for (let i = 0; i < n; i++) {
            let minIdx = i;
            this.updateBar(i, this.array[i], 'compare');
            for (let j = i + 1; j < n; j++) {
                this.updateBar(j, this.array[j], 'compare');
                this.log(`Checking if ${this.array[j]} < ${this.array[minIdx]}`);
                yield;
                if (this.array[j] < this.array[minIdx]) {
                    if (minIdx !== i) this.updateBar(minIdx, this.array[minIdx]);
                    minIdx = j;
                    this.updateBar(minIdx, this.array[minIdx], 'swap');
                    this.log(`New minimum found: ${this.array[minIdx]}`, 'info');
                    yield;
                } else {
                    this.updateBar(j, this.array[j]);
                }
            }
            if (minIdx !== i) {
                this.log(`Swapping index ${i} with ${minIdx}`, 'warning');
                [this.array[i], this.array[minIdx]] = [this.array[minIdx], this.array[i]];
                this.updateBar(i, this.array[i], 'swap');
                this.updateBar(minIdx, this.array[minIdx], 'swap');
                yield;
            }
            this.updateBar(minIdx, this.array[minIdx]);
            this.updateBar(i, this.array[i], 'sorted');
        }
    }

    *insertionSort() {
        let n = this.array.length;
        this.updateBar(0, this.array[0], 'sorted');
        for (let i = 1; i < n; i++) {
            let key = this.array[i];
            let j = i - 1;
            this.updateBar(i, this.array[i], 'compare');
            this.log(`Inserting ${key} into sorted portion`);
            yield;

            while (j >= 0 && this.array[j] > key) {
                this.log(`${this.array[j]} > ${key}, shifting right`, 'info');
                this.array[j + 1] = this.array[j];
                this.updateBar(j + 1, this.array[j + 1], 'swap');
                yield;
                this.updateBar(j + 1, this.array[j+1], 'sorted');
                j--;
            }
            this.array[j + 1] = key;
            this.updateBar(j + 1, this.array[j + 1], 'swap');
            this.log(`Placed ${key} at index ${j+1}`, 'success');
            yield;
            for(let k=0; k<=i; k++) this.updateBar(k, this.array[k], 'sorted');
        }
    }

    *quickSort(start, end) {
        if (start >= end) {
            if (start >= 0 && start < this.array.length) this.updateBar(start, this.array[start], 'sorted');
            return;
        }

        let pivotIdx = yield* this.partition(start, end);
        yield* this.quickSort(start, pivotIdx - 1);
        yield* this.quickSort(pivotIdx + 1, end);
    }

    *partition(start, end) {
        let pivot = this.array[end];
        this.log(`Pivot selected: ${pivot} (index ${end})`, 'info');
        this.updateBar(end, this.array[end], 'swap');
        let i = start - 1;

        for (let j = start; j < end; j++) {
            this.updateBar(j, this.array[j], 'compare');
            this.log(`Comparing ${this.array[j]} with pivot ${pivot}`);
            yield;
            if (this.array[j] < pivot) {
                i++;
                [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
                this.updateBar(i, this.array[i], 'swap');
                this.updateBar(j, this.array[j], 'swap');
                this.log(`Swapping index ${i} and ${j} because ${this.array[j]} < pivot`, 'warning');
                yield;
                this.updateBar(i, this.array[i]);
            }
            this.updateBar(j, this.array[j]);
        }
        [this.array[i + 1], this.array[end]] = [this.array[end], this.array[i + 1]];
        this.updateBar(i + 1, this.array[i + 1], 'swap');
        this.updateBar(end, this.array[end], 'swap');
        this.log(`Moving pivot to index ${i+1}`, 'success');
        yield;
        this.updateBar(end, this.array[end]);
        this.updateBar(i + 1, this.array[i + 1], 'sorted');
        return i + 1;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SortVisualizer();
});
