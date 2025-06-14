<!-- homepage-lite/server/widgets/weather/widget.svelte -->
<script>
  export let config = {}; // To accept potential config from widgets.yaml
  export let data = {};   // To accept potential data if a +route.js were added
</script>

<div class="widget-placeholder weather-widget content-card">
  <h3>Weather Widget</h3>
  <p>This widget is not yet implemented.</p>
  {#if config.location}
    <p>Configured Location: {config.location}</p>
  {/if}
</div>

<style>
  .weather-widget { /* Combined with .content-card */
    text-align: center;
    border: 1px dashed var(--text-color-secondary, #ccc); /* Keep dashed border, use theme color */
    background-color: var(--background-color-light, #f8f9fa); /* Muted background from theme */
    box-shadow: none; /* Remove external shadow from .content-card for a flatter look */
    color: var(--text-color-secondary); /* Make all default text muted */
    /* Padding will come from .content-card */
  }
  .weather-widget h3 {
    color: var(--text-color-secondary, #777); /* Ensure it's muted */
    /* margin-top: 0; (handled by global h3) */
    /* font-size will be from global h3 */
    margin-bottom: 0.5rem; /* Align with global h3 default or adjust if needed */
  }
  .weather-widget p {
    color: var(--text-color-secondary, #777);
    font-style: italic;
    font-size: 0.9em; /* Slightly smaller */
    margin-bottom: 0.25rem; /* Tighter spacing for multiple paragraphs */
  }
</style>
