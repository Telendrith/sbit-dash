<!-- homepage-lite/server/widgets/rss/widget.svelte -->
<script>
  export let config = {}; // To accept potential config from widgets.yaml
  export let data = {};   // To accept potential data if a +route.js were added
</script>

<div class="widget-placeholder rss-widget">
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
  .rss-widget {
    padding: 10px;
    border: 1px dashed #ccc;
    background-color: #f9f9f9;
    text-align: center;
  }
  .rss-widget h3 {
    margin-top: 0;
    color: #777;
  }
</style>
