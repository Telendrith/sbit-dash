// homepage-lite/server/lib/svelteRenderer.js
import { compile, register } from 'svelte/compiler'; // `register` for require hooks if we were using CommonJS and require()
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Svelte app component
const appComponentPath = path.resolve(__dirname, '..', 'views', 'App.svelte');

// Function to render the Svelte app
// This is a simplified example. Real-world might involve caching compiled components.
export async function renderSvelteApp(props = {}) {
  try {
    const svelteCode = fs.readFileSync(appComponentPath, 'utf8');

    // Compile Svelte component
    // For SSR, we need generate: 'ssr' and ensure we get the JS code
    const { js } = compile(svelteCode, {
      generate: 'ssr',
      format: 'esm', // Output ESM
      hydratable: false, // No client-side hydration for now
    });

    // To use the compiled code, we can dynamically import it.
    // This requires Node.js to be run with --experimental-vm-modules if not already default
    // Or, write to a temporary file and import that.
    // For simplicity in this environment, let's try to evaluate it.
    // NOTE: A more robust solution would use dynamic import or save to a .js file and import.
    //       `new Function` is generally not recommended for complex code due to security and scope issues.
    //       However, Svelte's SSR output is typically a self-contained module.

    // A common pattern for SSR is to save the compiled js.code to a temp file,
    // then import it. Let's simulate that.
    const tempDir = path.join(__dirname, '..', 'views', '.tmp_svelte');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, `temp-App-${Date.now()}.js`);

    fs.writeFileSync(tempFilePath, js.code);

    // Dynamic import paths need to be relative to the current file or absolute.
    // Or use fileURLToPath for import() if Node version supports it well for dynamic imports.
    // Let's construct a file:// URL for import().
    const tempFileUrl = 'file://' + tempFilePath;

    const { default: App } = await import(tempFileUrl); // Cache busting via unique filename

    fs.unlinkSync(tempFilePath); // Clean up temp file
    // Consider removing tempDir if it's empty and was created by this process,
    // but be careful if multiple renders happen concurrently.

    const { html, head, css } = App.render(props);

    return {
      html, // The main app HTML
      head, // Content for <svelte:head>
      // css: css.code // Svelte can also extract component-specific CSS
    };
  } catch (err) {
    console.error('[SvelteRenderer] Error rendering Svelte app:', err);
    throw err;
  }
}
