<script>
    import "../app.css";
</script>

<svelte:head>
    <title>DataStructure</title>
</svelte:head>

<nav class="main-nav">
    <div class="nav-content">
        <a href="/" class="logo">Data<span>Structure</span></a>
        <div class="nav-links">
            <a href="/">Main Menu</a>
            <a href="/sorting">Sorting</a>
            <a href="/stack">Stack</a>
            <a href="/queue">Queue</a>
            <a href="/linked-list">Linked List</a>
            <a href="/tree">Tree</a>
        </div>
    </div>
</nav>

<main>
    <slot />
</main>

<style>
    :global(body) {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8f9fa;
        color: #2c3e50;
    }

    .main-nav {
        background: #ffffff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 1rem 2rem;
        position: sticky;
        top: 0;
        z-index: 1000;
    }

    .nav-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .logo {
        font-size: 1.5rem;
        font-weight: bold;
        text-decoration: none;
        color: #4a90e2;
    }

    .logo span {
        color: #2c3e50;
        font-weight: normal;
    }

    .nav-links {
        display: flex;
        gap: 2rem;
    }

    .nav-links a {
        text-decoration: none;
        color: #6c757d;
        font-weight: 500;
        transition: color 0.2s;
    }

    .nav-links a:hover {
        color: #4a90e2;
    }

    main {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 0 1rem;
    }
</style>
