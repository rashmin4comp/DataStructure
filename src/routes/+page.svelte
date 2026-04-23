<section class="hero">
    <h1>Data Structures & Algorithms</h1>
    <p>Select a topic to begin exploring interactive visualizations.</p>
</section>

<div class="menu-grid">
    <a href="/sorting" class="menu-card">
        <div class="icon">📊</div>
        <h2>Sorting Algorithms</h2>
        <p>Visualize Bubble, Selection, Insertion, and Quick Sort in real-time.</p>
        <span class="btn">Explore Sorting</span>
    </a>

    <a href="/stack" class="menu-card">
        <div class="icon">📚</div>
        <h2>Stack</h2>
        <p>Learn LIFO (Last-In-First-Out) operations: Push and Pop.</p>
        <span class="btn">Explore Stack</span>
    </a>

    <a href="/queue" class="menu-card">
        <div class="icon">🚶‍♂️🚶‍♀️</div>
        <h2>Queue</h2>
        <p>Learn FIFO (First-In-First-Out) operations: Enqueue and Dequeue.</p>
        <span class="btn">Explore Queue</span>
    </a>

    <a href="/linked-list" class="menu-card">
        <div class="icon">🔗</div>
        <h2>Linked List</h2>
        <p>Explore Singly, Doubly, and Circular Linked Lists with node pointers.</p>
        <span class="btn">Explore Linked List</span>
    </a>

    <a href="/tree" class="menu-card">
        <div class="icon">🌳</div>
        <h2>Trees</h2>
        <p>Visualize Binary Search Trees, Traversals, Searching, and Deletion.</p>
        <span class="btn">Explore Trees</span>
    </a>

    <a href="/graph" class="menu-card">
        <div class="icon">🕸️</div>
        <h2>Graphs</h2>
        <p>Explore BFS, DFS, Dijkstra's Algorithm, and Minimum Spanning Trees.</p>
        <span class="btn">Explore Graphs</span>
    </a>
</div>

<style>
    .hero {
        text-align: center;
        margin-bottom: 4rem;
    }

    .hero h1 {
        font-size: 2rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
    }

    .hero p {
        font-size: 1rem;
        color: #6c757d;
    }

    .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
    }

    .menu-card {
        background: white;
        padding: 1rem 1.25rem;
        border-radius: 12px;
        text-decoration: none;
        color: inherit;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        border: 1px solid #dee2e6;
    }

    .menu-card:hover:not(.disabled) {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }

    .menu-card.disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .icon {
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
    }

    .menu-card h2 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: #4a90e2;
    }

    .menu-card p {
        font-size: 0.85rem;
        margin-bottom: 1rem;
        color: #6c757d;
        line-height: 1.4;
    }

    .btn {
        background: #4a90e2;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.8rem;
    }

    .btn.secondary {
        background: #e9ecef;
        color: #adb5bd;
    }
</style>
