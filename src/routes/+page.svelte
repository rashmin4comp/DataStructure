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

    <div class="menu-card disabled">
        <div class="icon">🔗</div>
        <h2>Linked Lists</h2>
        <p>Coming Soon: Understand nodes, pointers, and traversals.</p>
        <span class="btn secondary">Locked</span>
    </div>

    <div class="menu-card disabled">
        <div class="icon">🌳</div>
        <h2>Trees & Graphs</h2>
        <p>Coming Soon: Explore BFS, DFS, and Binary Search Trees.</p>
        <span class="btn secondary">Locked</span>
    </div>
</div>

<style>
    .hero {
        text-align: center;
        margin-bottom: 4rem;
    }

    .hero h1 {
        font-size: 3rem;
        color: #2c3e50;
        margin-bottom: 1rem;
    }

    .hero p {
        font-size: 1.2rem;
        color: #6c757d;
    }

    .menu-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .menu-card {
        background: white;
        padding: 2rem;
        border-radius: 16px;
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
        font-size: 3rem;
        margin-bottom: 1.5rem;
    }

    .menu-card h2 {
        margin-bottom: 1rem;
        color: #4a90e2;
    }

    .menu-card p {
        margin-bottom: 1.5rem;
        color: #6c757d;
        flex-grow: 1;
    }

    .btn {
        background: #4a90e2;
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
    }

    .btn.secondary {
        background: #e9ecef;
        color: #adb5bd;
    }
</style>
