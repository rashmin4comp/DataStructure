# DataStructure Visualizer - Development Context

## Project Overview
This is a SvelteKit-based web application designed to visualize various Data Structures and Algorithms (DSA) through interactive animations, real-time code tracing, and live variable monitoring.

## Architecture
- **Framework**: SvelteKit (Svelte 4)
- **Styling**: Vanilla CSS with CSS Variables for theme management.
- **Routing**: File-based routing located in `src/routes/`.
- **Layout**: `src/routes/+layout.svelte` provides global navigation and standard visual containers.

## Implemented Modules

### 1. Sorting Algorithms (`/sorting`)
- **Algorithms**: Bubble Sort, Selection Sort, Insertion Sort, Quick Sort.
- **Features**: Horizontal bar chart visualization, synchronized pseudo-code highlighting, and a live variable table.

### 2. Stack (`/stack`)
- **LIFO Logic**: Visualization of a vertical stack with `push` and `pop` operations.
- **Tracking**: Real-time monitoring of the `top` pointer and stack size.

### 3. Queue (`/queue`)
- **FIFO Logic**: Horizontal array visualization with `front` and `rear` pointers.
- **Operations**: Enqueue and Dequeue with step-by-step tracing.

### 4. Linked List (`/linked-list`)
- **Types**: Singly, Doubly, and Circular Linked Lists.
- **Operations**: Insert (Head, Last, At Index) and Delete (Head).
- **Visualization**: Dynamic node rendering with interactive arrows and pointer labels (`HEAD`, `TAIL`, `TEMP`).

### 5. Trees (`/tree`)
- **BST**: Binary Search Tree implementation.
- **Operations**: Insert, Search, and Delete (handling leaf, single child, and two children/successor cases).
- **Traversals**: In-order, Pre-order, Post-order with live sequence result display.
- **Graphics**: SVG-based tree layout with recursive positioning.

### 6. Graphs (`/graph`)
- **Representations**: Toggle between Adjacency Matrix and Adjacency List.
- **Traversals**: BFS (using Queue) and DFS (using Stack) with live data structure state visualization.
- **Advanced Algorithms**:
    - **Dijkstra**: Shortest path with node distance labels.
    - **MST**: Prim's and Kruskal's algorithms with total weight tracking and Priority Queue state.
- **Visuals**: SVG Graph with interactive node/edge states (active, visited, failed).

## Technical Patterns
- **Generators**: Algorithms are implemented as `function*` generators. This allows the UI to control the execution flow (Play/Pause/Step) without blocking the main thread.
- **Reactivity**: Svelte's reactive declarations (`$:`) and state assignments are used to keep the visualization and variable tables in sync with the algorithm's internal state.
- **Tracing**: Each generator updates an `activeLine` variable, which the UI uses to highlight lines in a pseudo-code block.
