// homepage-lite/server/lib/configLoader.js
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Ajv from 'ajv'; // Added Ajv
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
  const ajv = new Ajv({ allErrors: true });

  // Settings Validation
  const settingsDefault = { title: 'Sbit-Dash (Default)' };
  let settings = loadYamlFile('settings.yaml', settingsDefault);
  if (settings && settings !== settingsDefault) {
    const settingsSchema = {
      type: 'object',
      properties: {
        title: { type: 'string', nullable: true },
        defaultTheme: { type: 'string', nullable: true },
        dateFormat: { type: 'string', nullable: true }
      },
      additionalProperties: false
    };
    const validateSettings = ajv.compile(settingsSchema);
    if (!validateSettings(settings)) {
      console.error(`[ConfigLoader] Validation failed for settings.yaml: ${ajv.errorsText(validateSettings.errors)}`);
    }
  }

  // Services Validation
  const servicesDefault = [];
  let services = loadYamlFile('services.yaml', servicesDefault);
  if (services && services !== servicesDefault) {
    const servicesSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          group: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                url: { type: 'string' }, // Consider format: 'url' if ajv-formats is added later
                icon: { type: 'string', nullable: true },
                description: { type: 'string', nullable: true }
              },
              required: ['name', 'url'],
              additionalProperties: true
            }
          }
        },
        required: ['group', 'items'],
        additionalProperties: true
      }
    };
    const validateServices = ajv.compile(servicesSchema);
    if (!validateServices(services)) {
      console.error(`[ConfigLoader] Validation failed for services.yaml: ${ajv.errorsText(validateServices.errors)}`);
    }
  }

  // Widgets Validation
  const widgetsDefault = { layout: [] };
  let widgets = loadYamlFile('widgets.yaml', widgetsDefault);
  if (widgets && widgets !== widgetsDefault) {
    const widgetsSchema = {
      type: 'object',
      properties: {
        layout: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              config: { type: 'object', nullable: true, additionalProperties: true }
            },
            required: ['type'],
            additionalProperties: true
          }
        }
      },
      required: ['layout'],
      additionalProperties: true
    };
    const validateWidgets = ajv.compile(widgetsSchema);
    if (!validateWidgets(widgets)) {
      console.error(`[ConfigLoader] Validation failed for widgets.yaml: ${ajv.errorsText(validateWidgets.errors)}`);
    }
  }

  // Bookmarks Validation (uses servicesSchema)
  const bookmarksDefault = [];
  let bookmarks = loadYamlFile('bookmarks.yaml', bookmarksDefault);
  if (bookmarks && bookmarks !== bookmarksDefault) {
    // Reusing servicesSchema as bookmarksSchema is identical
    const bookmarksSchema = { // Defined here for clarity, could reuse servicesSchema directly
      type: 'array',
      items: {
        type: 'object',
        properties: {
          group: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                url: { type: 'string' },
                icon: { type: 'string', nullable: true },
                description: { type: 'string', nullable: true }
              },
              required: ['name', 'url'],
              additionalProperties: true
            }
          }
        },
        required: ['group', 'items'],
        additionalProperties: true
      }
    };
    const validateBookmarks = ajv.compile(bookmarksSchema);
    if (!validateBookmarks(bookmarks)) {
      console.error(`[ConfigLoader] Validation failed for bookmarks.yaml: ${ajv.errorsText(validateBookmarks.errors)}`);
    }
  }

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
