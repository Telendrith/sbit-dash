# Sbit-Dash

![Sbit-dash Screenshot](placeholder.png) <!-- TODO: Add screenshot -->

Sbit-Dash is a speed-obsessed, self-hosted, and configuration-driven dashboard application inspired by [Homepage.dev](https://gethomepage.dev/). It aims to provide a lightweight and customizable interface to your services, links, and important information at a glance.

## Stack Overview

Sbit-Dash is built with a modern, efficient stack:

-   **Runtime**: Node.js (v24.x ESM)
-   **Web Framework**: Fastify (v4.x)
-   **UI Framework**: Svelte 5 (Server-Side Rendered)
-   **Database**: better-sqlite3 (for caching and simple data storage)

## Key Features

-   **Configuration-Driven**: Easily manage your dashboard content (title, services, bookmarks, widgets) through simple YAML files.
-   **Server-Side Rendering (SSR)**: Svelte components are rendered on the server for fast initial page loads.
-   **Extensible Widget System**: Add new functionality through self-contained widget modules.
    -   **Clock Widget**: Displays the current time, configurable for different timezones.
    -   **Quote of the Day Widget**: Fetches and displays a daily quote (with caching).
    -   **Static Link Grid Widget**: Display a configurable grid of links.
-   **Custom Styling & Behavior**: Inject custom CSS and JavaScript snippets via `custom.css` and `custom.js` files in your configuration directory.
-   **SQLite Caching**: Built-in caching mechanism for API responses (e.g., for the Quote widget) to reduce external calls and improve speed.
-   **Health Check Endpoint**: `/healthz` route for monitoring application status and database connectivity.
-   **Lightweight and Fast**: Designed with performance as a primary goal.

## Prerequisites

Before you begin, ensure you have the following installed:

-   Node.js (v24.x is recommended)
-   npm (comes with Node.js)
-   Git (for cloning the repository)

## Getting Started

1.  **Clone the Repository**:
    ```bash
    git clone https://your-repository-url/sbit-dash.git
    # TODO: Replace with actual repository URL when available
    cd sbit-dash
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Your Dashboard**:
    -   Navigate to the configuration directory: `cd config/`
    -   Edit the YAML files to customize your dashboard:
        -   `settings.yaml`: Main dashboard settings like the title.
        -   `services.yaml`: Define groups of services or bookmarks.
        -   `widgets.yaml`: Configure which widgets appear and their specific options.
        -   `bookmarks.yaml`: Optional, can be used for additional bookmarks.
    -   Optionally, add custom styles to `custom.css` and custom client-side JavaScript to `custom.js`.
    -   Return to the project root: `cd ..`

4.  **Run Database Migrations**:
    This step sets up the necessary database schema for caching and other features.
    ```bash
    npm run migrate
    ```

5.  **Run the Application**:

    -   **Development Mode** (with hot-reloading for server-side code, using Nodemon):
        ```bash
        npm run dev
        # (Note: Full Svelte HMR for front-end components is not part of this basic setup)
        ```

    -   **Production Mode**:
        ```bash
        npm start
        ```
        Alternatively, you can run:
        ```bash
        NODE_ENV=production node server/index.js
        ```

    The dashboard should now be accessible at `http://localhost:3000` (or the configured `HOST` and `PORT`).

## Configuration In-Depth

All configuration files are located in the `config/` directory.

-   **`settings.yaml`**: General settings for your dashboard.
    ```yaml
    title: My Awesome Dashboard
    # defaultTheme: 'dark' # Future feature
    ```

-   **`services.yaml`**: Define groups of links/services.
    ```yaml
    - group: 'Productivity'
      items:
        - name: 'Google Drive'
          url: 'https://drive.google.com'
          icon: 'logos:google-drive' # Iconify icon name (rendering to be implemented)
        - name: 'Notion'
          url: 'https://notion.so'
          icon: 'simple-icons:notion'
          description: 'Your workspace'
    ```

-   **`widgets.yaml`**: Configure active widgets and their individual settings.
    ```yaml
    layout:
      - type: 'clock'
        config:
          timezone: 'America/New_York'
          showSeconds: true
      - type: 'quote'
        config: {} # No specific config needed for quote currently
      - type: 'staticLinkGrid'
        config:
          title: 'Dev Links'
          columns: 2
          links:
            - name: 'MDN'
              url: 'https://developer.mozilla.org/'
              icon: 'logos:mdn'
    ```

-   **`bookmarks.yaml`**: Similar structure to `services.yaml`, can be used for additional link organization. Loaded into `appConfig.bookmarks`.

-   **`custom.css` & `custom.js`**:
    -   Content from `custom.css` is injected into a `<style>` tag in the `<head>` of the page.
    -   Content from `custom.js` is injected into a `<script>` tag at the end of the `<body>`.

## Widget Development (For Contributors)

The widget system is designed to be modular:

-   Widgets reside in `server/widgets/<widgetName>/`.
-   **`widget.svelte`** (Required): The Svelte component for rendering the widget. It receives `config` (from `widgets.yaml`) and `data` (from `+route.js` if it exists) as props.
-   **`+route.js`** (Optional): If a widget needs to fetch server-side data, this file defines a Fastify plugin for its API endpoint (e.g., `/api/widgets/<widgetName>`). The `svelteRenderer` will automatically call this endpoint and pass the data to `widget.svelte`.
-   **`model.sql`** (Optional, Future): For widgets requiring their own database tables, a `model.sql` could define the schema, to be applied during a more advanced migration step.

## Available npm Scripts

-   `npm start`: Starts the application in production mode.
-   `npm run dev`: Starts the application in development mode using Nodemon.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run format`: Formats the codebase using Prettier.
-   `npm run migrate`: Runs database migrations (applies `server/db/schema.sql`).
-   `npm test`: (Placeholder) Will run tests when they are added.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
<!-- TODO: Create a LICENSE file with MIT License text -->
