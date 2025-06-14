<!-- homepage-lite/server/views/App.svelte -->
<script>
  export let title = 'Sbit-Dash'; // Default title
  export let services = [];
  export let customCss = '';
  export let customJs = '';
  export let widgetsHtml = ''; // HTML for all widgets, pre-rendered

  // This will hold the dynamically generated head content
  let headContent = '';

  // $: is Svelte's way of reacting to changes.
  // Update headContent whenever title changes.
  $: {
    headContent = `<title>${title}</title>`;
    // We could add more meta tags here if needed
  }
</script>

<svelte:head>
  {@html headContent}
  <link rel="stylesheet" href="/css/global.css">
  {#if customCss}
    <style id="custom-css-from-config">
      {@html customCss}
    </style>
  {/if}
  <script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js" integrity="sha256-3tdIwL3X2IeEmjYGeLpqJ9S8E0J52L1W3fR2j9f7Qv4=" crossorigin="anonymous"></script>
</svelte:head>

<div class="container">
  <header>
    <h1>{title}</h1>
    <div class="header-icons">
      <!-- Placeholder for icons like settings cog -->
      <!-- Example: <iconify-icon icon="mdi:cog"></iconify-icon> -->
    </div>
  </header>

  <main>
    {#if services && services.length > 0}
      <section id="services-section">
        <h2>Services & Bookmarks</h2>
        <div class="responsive-flex-grid">
        {#each services as group}
          <div class="service-group content-card" class:empty-group={group.items.length === 0}>
            <h3>{group.group}</h3>
            {#if group.items.length > 0}
              <ul>
                {#each group.items as item}
                  <li>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {#if item.icon}
                        <iconify-icon icon="{item.icon}" class="service-icon"></iconify-icon>
                      {/if}
                      {item.name}
                    </a>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="empty-group-message">No bookmarks in this group yet.</p>
            {/if}
          </div>
        {/each}
        </div>
      </section>
    {/if}

    <!-- Placeholder for widgets, to be implemented in Step 5 -->
    <section id="widgets-section">
        <h2>Widgets</h2>
        {#if widgetsHtml}
          <div class="responsive-flex-grid">
            {@html widgetsHtml}
          </div>
        {:else}
            <p>No widgets to display or error loading widgets.</p>
        {/if}
    </section>

  </main>

  <footer>
    <p>Sbit-Dash</p>
  </footer>
</div>

{#if customJs}
  <script id="custom-js-from-config">
    {@html `//<![CDATA[
${customJs}
//]]>`}
  </script>
{/if}

<style>
  /* Basic styling for App.svelte */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 50px; /* Generous padding for larger screens */
    /* font-family: sans-serif; */ /* Removed to allow global.css to take precedence */
  }

  @media (max-width: 768px) {
    .container {
      padding: 20px; /* Less padding on mobile */
    }
  }

  header {
    text-align: center;
    padding-bottom: 20px;
    margin-bottom: 30px;
    border-bottom: 1px solid var(--text-color-secondary, #dee2e6); /* Use variable for border color */
    position: relative;
  }

  footer {
    text-align: center;
    padding: 20px 0;
    margin-top: 40px;
    border-top: 1px solid var(--text-color-secondary, #dee2e6); /* Use variable for border color */
    font-size: 0.9em; /* Slightly smaller text */
    color: var(--text-color-secondary, #6c757d); /* Muted text color */
  }

  footer p { /* Svelte scopes this to the component's footer p */
      margin-bottom: 0; /* Remove default bottom margin from p if any */
  }

  .service-group {
    margin-bottom: 20px;
  }
  .service-group h3 {
    margin-bottom: 15px; /* User requirement: "medium bold", "margin-bottom: 15px" */
    /* Removed border-bottom and padding-bottom as the card provides separation */
  }
  .service-group ul {
    list-style: none;
    padding: 0;
  }
  .service-group li { /* This contains the <a> tag, so its margin might need adjustment or removal */
    margin-bottom: 0; /* Let the <a> tag's margin handle spacing */
  }
  .service-group ul li a {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 4px; /* Space between items */
    border-radius: 6px;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    color: var(--text-color-primary);
  }
  .service-group ul li a:hover {
    background-color: var(--accent-color-soft);
    color: var(--accent-color);
  }
  .service-group ul li a:hover .service-icon { /* Scope to ensure icon within hovered 'a' is affected */
    transform: scale(1.15);
  }
  .widget-placeholder {
    border: 1px dashed #ccc;
    padding: 10px;
    margin-bottom: 10px;
    background-color: #f9f9f9;
  }
  /* Removed old .icon style */
  .service-icon {
    margin-right: 0.75em; /* Slightly more space */
    /* vertical-align is not needed for flex items */
    font-size: 1.2em; /* Keep as is or adjust if needed */
    transition: transform 0.2s ease-in-out;
    flex-shrink: 0; /* Prevent icon from shrinking if text is long */
  }

  .header-icons {
    position: absolute;
    top: 25px; /* Adjust this value based on visual appeal and header padding */
    right: 30px; /* More padding from edge */
    font-size: var(--font-size-lg); /* Slightly smaller than xl for subtle icon */
  }
  /* Styling for iconify-icon if used directly */
  .header-icons iconify-icon { /* Svelte might scope this, or use :global() if needed */
      color: var(--text-color-secondary);
      cursor: pointer;
  }
  .header-icons iconify-icon:hover {
      color: var(--accent-color);
  }

  .empty-group-message {
    color: var(--text-color-secondary);
    font-style: italic;
    text-align: center;
    padding: 20px 0; /* Give it some vertical space */
  }

  .service-group.empty-group {
    background-color: var(--background-color-light, #f8f9fa); /* Use a slightly off-white/gray background */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* Lighter shadow or none */
  }

  .service-group.empty-group h3 { /* Ensure the title in an empty group is also muted */
      color: var(--text-color-secondary);
  }
</style>
