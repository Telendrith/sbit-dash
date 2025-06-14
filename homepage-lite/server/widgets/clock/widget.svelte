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

      if (effectiveConfig.showSeconds) {
        // Make the last colon blink if it's part of seconds
        let parts = currentTime.split(':');
        if (parts.length > 1) { // Check if there's at least one colon
            const lastColonIndex = currentTime.lastIndexOf(':');
            // Ensure it's the colon separating minutes and seconds, not hours and minutes if no seconds
            // This check works if locale format is like H:M:S or H:M.
            // More robust check might be needed for locales with different separators or orders.
            if (lastColonIndex !== -1 && parts.length > 2) {
              currentTime = currentTime.substring(0, lastColonIndex) +
                            '<span class="blinking-colon">:</span>' +
                            currentTime.substring(lastColonIndex + 1);
            }
        }
      }
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

<div class="clock-widget content-card">
  <h3>Clock</h3>
  <div class="time-display">
    {@html currentTime}
  </div>
  {#if effectiveConfig.timezone}
    <div class="timezone-info">
      Timezone: {effectiveConfig.timezone}
    </div>
  {/if}
</div>

<style>
  .clock-widget {
    text-align: center;
    /* Properties like padding, border, border-radius, background-color
       are now expected to come from the .content-card class */
  }
  /* .clock-widget h3 rule removed to rely on global h3 styles */
  .time-display {
    font-size: calc(var(--font-size-base) * 2.5); /* Approx 2.5x base text */
    font-weight: bold; /* Keep bold */
    color: var(--text-color-primary); /* Use theme color */
    margin-bottom: 10px; /* Keep or adjust as needed */
    line-height: 1.2; /* Ensure tight line height for large text */
  }
  .timezone-info {
    font-size: 0.85em; /* As per plan */
    color: var(--text-color-secondary); /* Use theme color */
    margin-top: 5px; /* As per plan */
  }

  @keyframes blink {
    50% { opacity: 0; }
  }
  .blinking-colon {
    animation: blink 1s step-start infinite;
  }
</style>
