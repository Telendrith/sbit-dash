<!-- homepage-lite/server/widgets/rss/widget.svelte -->
<script>
  export let config = {}; // To accept potential config from widgets.yaml
  export let data = {};   // To accept potential data if a +route.js were added
</script>

<div class="widget-placeholder rss-widget content-card">
  <h3>RSS Feed Widget</h3>
  <p>This widget is not yet implemented.</p>
  {#if config.title}
    <p>Configured Title: {config.title}</p>
  {/if}
  {#if config.url}
    <p>Configured URL: {config.url}</p>
  {/if}
</div>

<style>
  .rss-widget { /* Combined with .content-card */
    text-align: center;
    border: 1px dashed var(--text-color-secondary, #ccc); /* Dashed border, themed */
    background-color: var(--background-color-light, #f8f9fa); /* Muted background */
    box-shadow: none; /* Remove .content-card shadow */
    color: var(--text-color-secondary); /* Default text muted */
    /* Padding will come from .content-card */
  }
  .rss-widget h3 {
    color: var(--text-color-secondary, #777); /* Ensure it's muted */
    margin-bottom: 0.5rem; /* Consistent with global h3 and other placeholders */
    /* font-size will be from global h3 */
    /* margin-top: 0; (handled by global h3) */
  }
  .rss-widget p {
    color: var(--text-color-secondary, #777);
    font-style: italic;
    font-size: 0.9em; /* Slightly smaller */
    margin-bottom: 0.25rem; /* Tighter spacing for multiple paragraphs */
  }
</style>
