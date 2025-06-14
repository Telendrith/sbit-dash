<!-- homepage-lite/server/widgets/quote/widget.svelte -->
<script>
  export let data = { quote: 'Loading quote...', author: '' }; // Expects { quote, author } or error object
  export let config = {}; // For any future config options

  // $: console.log('[QuoteWidget] Received data:', data); // For debugging
</script>

<div class="quote-widget">
  <h3>Daily Quote</h3>
  {#if data && data.quote}
    <blockquote class="quote-text">
      "{data.quote}"
    </blockquote>
    <p class="quote-author">- {data.author || 'Unknown'}</p>
  {:else if data && data.error}
    <p class="error-message">Could not load quote: {data.error}</p>
  {:else}
    <p>Loading...</p>
  {/if}
</div>

<style>
  .quote-widget {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #fff;
    font-family: 'Georgia', serif;
  }
  .quote-widget h3 {
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 1.1em;
    color: #555;
    text-align: center;
  }
  .quote-text {
    font-size: 1.2em;
    line-height: 1.6;
    margin-bottom: 10px;
    font-style: italic;
    color: #333;
    border-left: 3px solid #007bff;
    padding-left: 10px;
  }
  .quote-author {
    font-size: 1em;
    text-align: right;
    color: #777;
    font-style: normal;
  }
  .error-message {
    color: #d9534f; /* Bootstrap's danger color */
    text-align: center;
  }
</style>
