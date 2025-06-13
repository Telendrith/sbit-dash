# Sbit-dash — Project Documentation

> **Version:** initial architecture refactor (ESM + co‑located widgets + SQLite)

---

## 1. Overview

Sbit-dash is a speed‑obsessed, self‑hosted dashboard inspired by Homepage.dev.  The stack is: **Node 24 (ESM)** + **Fastify 4** + **Svelte 5 (SSR)** with **better‑sqlite3** for lightweight persistence and caching.

Key design rules:

* **Server‑render first** – the dashboard is usable with JS disabled.
* **One folder = one widget** – fetcher, DB model, API route, and Svelte view live together.
* **Single‑process simplicity** – no background workers, no message bus.
* **SQLite as cache and DB funtions ** – WAL mode, sync SQL, millisecond reads.

---

## 2. Directory Layout (reference)

```
homepage-lite/
├─ server/
│  ├─ index.js          # prod entry; just `node .`
│  ├─ createServer.js   # returns configured Fastify instance
│  ├─ plugins/
│  │   ├─ sqlite.js     # attaches `db` to Fastify
│  │   └─ static.js     # serves /public with cache headers
│  ├─ routes/
│  │   └─ healthz.js    # readiness+ liveness probe
│  ├─ db/
│  │   ├─ schema.sql    # core tables (cache, prefs, migrations)
│  │   └─ migrate.js    # concatenates *.sql & applies if hash diff
│  └─ widgets/
│      ├─ pihole/
│      │   ├─ widget.svelte   # SSR component
│      │   ├─ fetch.js        # talks to Pi‑hole API
│      │   ├─ +route.js       # GET /api/widgets/pihole
│      │   └─ model.sql       # optional per‑widget table(s)
│      └─ unifi/…
├─ public/
│  ├─ css/
│  ├─ js/
│  └─ backgrounds/
├─ package.json
└─ README.md (quick‑start)
```

### File/Folder Notes

| Path                       | Purpose                                                                                                                                                    | Key Points                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **server/index.js**        | Minimal shell – loads env, calls `createServer()`, `await fastify.listen()`.                                                                               | Keeps CLI interface thin so tests skip network.              |
| **server/createServer.js** | Registers plugins, auto‑loads widgets, returns Fastify instance.                                                                                           | Accepts opts (`logger`, `dbFile`) for reuse in tests.        |
| **plugins/sqlite.js**      | Opens DB, sets WAL & synchronous=NORMAL, adds `fastify.db`.                                                                                                | Closes gracefully in `onClose`.                              |
| **db/migrate.js**          | Reads `server/db/schema.sql` + every `model.sql` under `widgets/*`, calculates SHA‑256. If changed, runs inside a txn, then updates `pragma user_version`. | One command handles all schema drift.                        |
| **widgets/\*/+route.js**   | Fastify‐plugin route module; imports sibling `fetch.js`.                                                                                                   | Guarantees API payload matches what `widget.svelte` expects. |

---

## 3. SQLite Layer

SQLite is **optional** but on by default.  Core tables:

```sql
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS migrations (
  hash TEXT PRIMARY KEY,
  applied_at INTEGER DEFAULT (strftime('%s','now'))
);
```

Widgets may declare additional tables in `model.sql` (idempotent `CREATE TABLE IF NOT EXISTS …`).

**Pattern:** cache results for up to 15 s:

```js
const row = db.prepare('SELECT json FROM cache WHERE key=? AND expires_at>?')
             .get('pihole', Date.now());
```

---

## 4. Widget Anatomy

Inside any `server/widgets/<name>/` folder:

| File            | Role                                                        |
| --------------- | ----------------------------------------------------------- |
| `fetch.js`      | Pure async function `(fastify) => data` (may query SQLite). |
| `widget.svelte` | SSR component; `export let data`.  Hydration optional.      |
| `+route.js`     | Registers `/api/widgets/<name>`; handles cache + timeout.   |
| `model.sql`     | Declarative SQL – optional.                                 |

> **Hydration rule:** a widget only ships JS if it needs interactivity; use `?client` import for Svelte 5 runes.

---

## 5. Request → Render Lifecycle

1. **HTTP GET /** → Fastify SSR stream
2. `createServer()` populates `locals.widgets` by calling `fetch.js` for each enabled widget **in parallel** with a 1 s timeout.
3. HTML streams once any widget resolves (edge‑render first; slower widgets display skeleton).
4. Browser downloads `widget-*.js` chunks on idle.
5. Service‑worker (public/js/sw\.js) installs & caches `/api/widgets/*` with `stale‑while‑revalidate`.

---

## 6. Development & Ops

```bash
pnpm i                          # install deps
pnpm run migrate                # create/upgrade SQLite
pnpm run dev                    # nodemon reload
pnpm run test                   # (add Playwright/Lighthouse later)

# Production
NODE_ENV=production node server/index.js
```

* **Health checks:** `GET /healthz` returns `{ status:"ok", uptime_ms }` plus SQLite pragma check.
* **Logs:** Fastify pino JSON; pipe to Docker stdout → Loki/Grafana.

---

## 7. Adding a New Widget (TL;DR)

1. `mkdir server/widgets/weather`
2. Write `fetch.js` communicating with your weather API (respect 1 s timeout)
3. Add any needed tables to `model.sql` (idempotent)
4. Create `widget.svelte` for layout
5. `npm run migrate`
6. Visit `/api/widgets/weather` for JSON, then load homepage.

---

© 2025, MIT‐licensed.  Happy hacking! \:rocket:
