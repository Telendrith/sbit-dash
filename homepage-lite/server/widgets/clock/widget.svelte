<!-- homepage-lite/server/widgets/clock/widget.svelte -->
<script>
  export let config = {}; // Receives config from widgets.yaml, e.g., { timezone, showSeconds }

  // Default configuration
  const defaultConfig = {
    timezone: undefined, // undefined means use local timezone
    showSeconds: true,
    locale: 'en-US', // Default locale
  };

  // Merge provided config with defaults
  const effectiveConfig = { ...defaultConfig, ...config };

  let currentTime = '';
  let intervalId = null;

  function updateTime() {
    try {
      const now = new Date();
      const options = {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: effectiveConfig.timezone, // Can be undefined for local
      };
      if (effectiveConfig.showSeconds) {
        options.second = 'numeric';
      }
      currentTime = now.toLocaleString(effectiveConfig.locale, options);
    } catch (e) {
      console.error("Error formatting time for clock widget:", e);
      currentTime = "Error";
      if (intervalId) clearInterval(intervalId); // Stop interval on error
    }
  }

  // onMount is Svelte's lifecycle function that runs after the component is first rendered to the DOM.
  // This is where client-side JavaScript that needs the DOM should go.
  // For SSR, this block will not run on the server. It runs in the browser.
  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
    updateTime(); // Initial update when component mounts in browser
    intervalId = setInterval(updateTime, 1000); // Update every second

    // Optional: log that the clock widget has mounted on the client
    // console.log('Clock widget mounted on client with config:', effectiveConfig);
  });

  // onDestroy is Svelte's lifecycle function that runs before the component is destroyed.
  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  // For SSR: Calculate initial time directly in the script setup.
  // This ensures that the server-rendered output shows the time at render,
  // and then onMount will take over on the client.
  if (typeof window === 'undefined') { // Check if running on server
    updateTime();
  }
</script>

<div class="clock-widget">
  <h3>Clock</h3>
  <div class="time-display">
    {currentTime}
  </div>
  {#if effectiveConfig.timezone}
    <div class="timezone-info">
      Timezone: {effectiveConfig.timezone}
    </div>
  {/if}
</div>

<style>
  .clock-widget {
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 5px;
    background-color: #f9f9f9;
    text-align: center;
  }
  .clock-widget h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.2em;
    color: #333;
  }
  .time-display {
    font-size: 2em;
    font-weight: bold;
    color: #0056b3; /* A nice blue for the time */
    margin-bottom: 10px;
  }
  .timezone-info {
    font-size: 0.8em;
    color: #777;
  }
</style>
