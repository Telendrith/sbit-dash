// homepage-lite/server/lib/svelteRenderer.js
import { compile } from 'svelte/compiler';
import { render as svelteRender } from 'svelte/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // Added pathToFileURL

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Svelte app component
const appComponentPath = path.resolve(__dirname, '..', 'views', 'App.svelte');
const widgetsBaseDir = path.resolve(__dirname, '..', 'widgets');
const tempSvelteDirRoot = path.resolve(__dirname, '..', 'views', '.tmp_svelte'); // Centralized temp dir

// Ensure the root temporary directory for Svelte compiled files exists
if (!fs.existsSync(tempSvelteDirRoot)) {
  fs.mkdirSync(tempSvelteDirRoot, { recursive: true });
}

// Renamed and modified: Renders the main App.svelte shell
export async function renderAppShell(props = {}, fastifyInstance) {
  try {
    const svelteCode = fs.readFileSync(appComponentPath, 'utf8');
    const { js } = compile(svelteCode, { generate: 'ssr', css: 'injected' });

    const tempFilePath = path.join(tempSvelteDirRoot, `AppShell_${Date.now()}.js`);

    fs.writeFileSync(tempFilePath, js.code);
    const fileUrl = pathToFileURL(tempFilePath).href;

    const { default: AppComponentDefinition } = await import(fileUrl);
    fs.unlinkSync(tempFilePath); // Moved unlink earlier

    const { html, head } = svelteRender(AppComponentDefinition, { props: props });
    return { html, head };
  } catch (err) {
    const logPayload = { err, propsKeys: Object.keys(props || {}) };
    const errorMsg = '[SvelteRenderer] Error rendering App.svelte shell:';
    if (fastifyInstance && fastifyInstance.log) {
      fastifyInstance.log.error(logPayload, errorMsg);
    } else {
      console.error(errorMsg, err, logPayload);
    }
    throw err;
  }
}

// New function to render individual widgets
export async function renderWidget(widgetType, widgetConfig, fastifyInstance) {
  const widgetComponentPath = path.join(widgetsBaseDir, widgetType, 'widget.svelte');
  let widgetData = {};

  if (!fs.existsSync(widgetComponentPath)) {
    const errorMsg = `Widget component not found: ${widgetComponentPath}`;
    if (fastifyInstance && fastifyInstance.log) {
        fastifyInstance.log.warn(`[SvelteRenderer] ${errorMsg}`);
    } else {
        console.warn(`[SvelteRenderer] ${errorMsg}`);
    }
    return { html: `<div class="widget-error">Widget type "${widgetType}" not found.</div>`, head: '', css: '' };
  }

  // Placeholder for Step 3: Data Fetching Logic (as per instructions)
  const widgetRouteFilePath = path.join(widgetsBaseDir, widgetType, '+route.js'); // Corrected variable name
  if (fs.existsSync(widgetRouteFilePath)) {
    if (fastifyInstance && fastifyInstance.log) {
      fastifyInstance.log.info(`[SvelteRenderer] Widget ${widgetType} has +route.js, attempting to fetch data via inject...`);
    }
    try {
      const response = await fastifyInstance.inject({
        method: 'GET',
        url: `/api/widgets/${widgetType}`,
      });

      if (response.statusCode === 200) {
        widgetData = JSON.parse(response.payload);
        if (fastifyInstance && fastifyInstance.log) {
          fastifyInstance.log.info(`[SvelteRenderer] Successfully fetched data for widget ${widgetType}`);
        }
      } else {
        if (fastifyInstance && fastifyInstance.log) {
          fastifyInstance.log.error({ widgetType, statusCode: response.statusCode, payload: response.payload }, `Error fetching data for widget ${widgetType} via inject.`);
        }
        widgetData = { error: `Failed to load data (status ${response.statusCode}) for ${widgetType}` };
      }
    } catch (fetchErr) {
      if (fastifyInstance && fastifyInstance.log) {
        fastifyInstance.log.error({ err: fetchErr, widgetType }, `Exception during fastify.inject for widget ${widgetType}`);
      }
      widgetData = { error: `Exception fetching data for ${widgetType}` };
    }
  } else {
    if (fastifyInstance && fastifyInstance.log) {
      fastifyInstance.log.info(`[SvelteRenderer] Widget ${widgetType} does not have a +route.js file. No server-side data to fetch.`);
    }
  }


  try {
    const widgetSvelteCode = fs.readFileSync(widgetComponentPath, 'utf8');
    // Unique name for the Svelte component class to avoid conflicts if multiple widgets of same type (though SSR usually new instance)
    // const componentName = `Widget_${widgetType.replace(/[^a-zA-Z0-9_]/g, '_')}`; // Name option removed
    const { js } = compile(widgetSvelteCode, { generate: 'ssr', css: 'injected' });

    const tempFilePath = path.join(tempSvelteDirRoot, `Widget_${widgetType.replace(/[^a-zA-Z0-9_]/g, '_')}_${Date.now()}.js`);

    fs.writeFileSync(tempFilePath, js.code);
    const fileUrl = pathToFileURL(tempFilePath).href;

    const { default: WidgetComponentDefinition } = await import(fileUrl);
    fs.unlinkSync(tempFilePath); // Moved unlink earlier

    const widgetSsrProps = { config: widgetConfig, data: widgetData };
    const { html, head } = svelteRender(WidgetComponentDefinition, { props: widgetSsrProps });
    return { html, head: head || '' }; // CSS is now part of head
  } catch (err) {
    const errorMsg = `[SvelteRenderer] Error rendering widget ${widgetType}:`;
    const logPayload = { err, widgetType, widgetConfig };
    if (fastifyInstance && fastifyInstance.log) {
      fastifyInstance.log.error(logPayload, errorMsg);
    } else {
      console.error(errorMsg, err, logPayload);
    }
    return { html: `<div class="widget-error">Error rendering widget "${widgetType}". Check server logs.</div>`, head: '', css: '' };
  }
}

// New function to render the entire dashboard page
export async function renderDashboardPage(appConfig, fastifyInstance) {
  let widgetsHtml = '';
  let widgetsHead = '';

  if (appConfig.widgets && appConfig.widgets.layout) {
    for (const widgetInstance of appConfig.widgets.layout) {
      const { type, config } = widgetInstance;
      if (type) {
        const renderedWidget = await renderWidget(type, config, fastifyInstance);
        widgetsHtml += renderedWidget.html;
        if (renderedWidget.head) widgetsHead += renderedWidget.head;
      }
    }
  }

  const appShellProps = {
    title: appConfig.settings.title || 'Sbit-Dash',
    services: appConfig.services || [],
    customCss: appConfig.customCss || '',
    customJs: appConfig.customJs || '',
    widgetsHtml: widgetsHtml,
    // additionalHeadContent: widgetsHead, // App.svelte would need to handle this if passed
  };

  const { html: appShellHtml, head: appShellHead } = await renderAppShell(appShellProps, fastifyInstance);

  const finalHead = (appShellHead || '') + (widgetsHead || ''); // Combine App shell head and widgets head

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${finalHead}
      <!-- Any global CSS not handled by Svelte components could be linked here -->
    </head>
    <body>
      <div id="app-root">
        ${appShellHtml}
      </div>
      <!-- Any global JS not handled by Svelte components could be linked here -->
    </body>
    </html>
  `;
}
