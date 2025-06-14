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
  </header>

  <main>
    {#if services && services.length > 0}
      <section id="services-section">
        <h2>Services & Bookmarks</h2>
        {#each services as group}
          <div class="service-group">
            <h3>{group.group}</h3>
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
          </div>
        {/each}
      </section>
    {/if}

    <!-- Placeholder for widgets, to be implemented in Step 5 -->
    <section id="widgets-section">
        <h2>Widgets</h2>
        {#if widgetsHtml}
            {@html widgetsHtml}
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
  <script id="custom-js-from-config" bind:textContent={`//<![CDATA[
${customJs}
//]]>`}></script>
{/if}

<style>
  /* Basic styling for App.svelte */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
  }
  header, footer {
    text-align: center;
    margin-bottom: 20px;
  }
  .service-group {
    margin-bottom: 20px;
  }
  .service-group h3 {
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  }
  .service-group ul {
    list-style: none;
    padding: 0;
  }
  .service-group li {
    margin-bottom: 5px;
  }
  .widget-placeholder {
    border: 1px dashed #ccc;
    padding: 10px;
    margin-bottom: 10px;
    background-color: #f9f9f9;
  }
  /* Removed old .icon style */
  .service-icon {
    margin-right: 0.5em;
    vertical-align: -0.125em; /* Adjusts vertical alignment */
    font-size: 1.2em; /* Slightly larger icons */
  }
</style>
