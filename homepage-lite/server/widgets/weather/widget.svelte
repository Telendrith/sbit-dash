<!-- homepage-lite/server/widgets/weather/widget.svelte -->
<script>
  export let config = {}; // To accept potential config from widgets.yaml
  export let data = {};   // To accept potential data if a +route.js were added
</script>

<div class="widget-placeholder weather-widget">
  <h3>Weather Widget</h3>
  <p>This widget is not yet implemented.</p>
  {#if config.location}
    <p>Configured Location: {config.location}</p>
  {/if}
</div>

<style>
  .weather-widget {
    padding: 10px;
    border: 1px dashed #ccc;
    background-color: #f9f9f9;
    text-align: center;
  }
  .weather-widget h3 {
    margin-top: 0;
    color: #777;
  }
</style>
