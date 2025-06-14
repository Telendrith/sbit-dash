// homepage-lite/server/lib/configLoader.js
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.resolve(__dirname, '..', '..', 'config');

function loadYamlFile(fileName, defaultValue = {}) {
  const filePath = path.join(CONFIG_DIR, fileName);
  try {
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      return yaml.load(fileContents) || defaultValue;
    }
    console.warn(`[ConfigLoader] File not found: ${fileName}. Using default value.`);
    return defaultValue;
  } catch (e) {
    console.error(`[ConfigLoader] Error loading or parsing ${fileName}: ${e.message}`);
    return defaultValue; // Return default if error
  }
}

function loadTextFile(fileName, defaultValue = '') {
  const filePath = path.join(CONFIG_DIR, fileName);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    // It's okay if custom css/js are missing, so no warning spam.
    // console.log(`[ConfigLoader] Optional file not found: ${fileName}. Using default value.`);
    return defaultValue;
  } catch (e) {
    console.error(`[ConfigLoader] Error loading ${fileName}: ${e.message}`);
    return defaultValue;
  }
}

export function loadAllConfigs() {
  const settings = loadYamlFile('settings.yaml', { title: 'Sbit-Dash (Default)' });
  const services = loadYamlFile('services.yaml', []);
  const widgets = loadYamlFile('widgets.yaml', { layout: [] }); // Default to an object with an empty layout array
  const bookmarks = loadYamlFile('bookmarks.yaml', []); // Can be merged with services or kept separate

  const customCss = loadTextFile('custom.css', '');
  const customJs = loadTextFile('custom.js', '');

  return {
    settings,
    services,
    widgets,
    bookmarks,
    customCss,
    customJs,
  };
}
