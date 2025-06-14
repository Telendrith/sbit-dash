<!-- homepage-lite/server/widgets/staticLinkGrid/widget.svelte -->
<script>
  // Config object will be passed as a prop from the SSR rendering logic,
  // originating from widgets.yaml
  export let config = {
    title: 'Links', // Default title
    links: [],      // Default to empty array of links
    columns: 1      // Default to a single column layout
  };

  // Validate and provide defaults for links
  const GAUZE_ICON_DEFAULT = 'mdi:link-variant'; // A default icon if none specified

  $: processedLinks = (config.links || []).map(link => ({
    ...link,
    name: link.name || 'Unnamed Link',
    url: link.url || '#',
    icon: link.icon || GAUZE_ICON_DEFAULT, // Add a default icon
    description: link.description || '' // Add description
  }));

  // Determine column class based on config
  // This is a simple way to control layout via CSS grid
  let columnClass = 'grid-columns-1'; // Default
  if (config.columns === 2) columnClass = 'grid-columns-2';
  else if (config.columns === 3) columnClass = 'grid-columns-3';
  else if (config.columns >= 4) columnClass = 'grid-columns-4';

  // $: console.log('[StaticLinkGrid] Received config:', config);
  // $: console.log('[StaticLinkGrid] Processed links:', processedLinks);
</script>

<div class="static-link-grid-widget">
  {#if config.title}
    <h3>{config.title}</h3>
  {/if}

  {#if processedLinks.length > 0}
    <ul class="link-grid {columnClass}">
      {#each processedLinks as link}
        <li class="link-item">
          <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.description || link.name}>
            <!-- Basic icon placeholder using a span. Could be enhanced with an SVG component or Iconify later -->
            <span class="link-icon" data-icon={link.icon}></span>
            <span class="link-name">{link.name}</span>
            {#if link.description}
              <span class="link-description">{link.description}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    <p>No links configured for this grid.</p>
  {/if}
</div>

<style>
  .static-link-grid-widget {
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    background-color: #fdfdfd;
  }
  .static-link-grid-widget h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.15em;
    color: #444;
  }
  .link-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px; /* Gap between grid items */
  }

  /* Column classes for the grid */
  .grid-columns-1 { grid-template-columns: repeat(1, 1fr); }
  .grid-columns-2 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } /* Responsive columns */
  .grid-columns-3 { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .grid-columns-4 { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }


  .link-item a {
    display: block; /* Changed to block for better layout control */
    padding: 10px;
    text-decoration: none;
    color: #0066cc;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    overflow: hidden; /* To contain icon and text */
  }
  .link-item a:hover {
    background-color: #f0f8ff; /* Light blue on hover */
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  .link-icon {
    /* Basic styling for a placeholder icon.
       Replace with actual icon rendering (e.g., Iconify, SVG) later. */
    display: inline-block; /* Or inline-flex for alignment */
    width: 1.2em;
    height: 1.2em;
    margin-right: 8px;
    background-color: #ddd; /* Placeholder color */
    vertical-align: middle;
    /* A simple way to hint at the icon name for now */
    content: attr(data-icon);
    font-size: 0.7em;
    text-align: center;
    line-height: 1.2em;
    border-radius: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link-name {
    vertical-align: middle;
    font-weight: 500;
  }
  .link-description {
    display: block; /* Or inline-block if preferred */
    font-size: 0.85em;
    color: #555;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
