# BulleBrowser embed widget — CRM integration

Replaces a LiveChat-style chatbot with the BulleBrowser agent. A launcher bubble
sits bottom-right of the CRM; clicking it opens a chat where users type a task,
and the agent operates the CRM **in the user's own logged-in session**, on the
page they're on — clicking, typing, reading, with a visible cursor.

## Two pieces

1. **The widget** — `apps/web/public/widget.js`, served from `https://bullebrowser.com/widget.js`.
   Self-contained (shadow DOM, no framework, no CSS bleed). This is what you drop
   into the CRM in place of the LiveChat snippet.

2. **The backend** — `server.mjs` here, a runnable reference. It holds the API
   key and runs the model loop. **An API key can never live in page JavaScript**,
   which is the only reason a backend exists. Host it wherever your CRM's backend
   lives; lock CORS to your CRM origin.

## Embed (in the CRM, replacing LiveChat)

One self-configuring script tag (drop it where the LiveChat snippet was):

```html
<script src="https://bullebrowser.com/widget.js"
        data-endpoint="https://YOUR-BACKEND"
        data-token="THE-SAME-VALUE-AS-WIDGET_TOKEN"
        data-title="BulleBrowser"
        data-accent="#2563EB"
        data-greeting="Ask me to do anything in the dashboard."></script>
```

## Run the backend

```bash
ANTHROPIC_API_KEY=sk-ant-… \
EEO_PUBLIC_ID=…    \   # X-Public-ID  (from the EEO Dashboard → Manage Account → Secure API)
EEO_SECRET_KEY=…   \   # X-Secret-Key (keep secret — env var only, never in code)
node services/widget-backend/server.mjs                # :8787
```

**API-first is wired.** With `EEO_PUBLIC_ID` + `EEO_SECRET_KEY` set, the agent
gets the EEO Dashboard's Secure API as tools (`eeo_list_contacts`,
`eeo_find_contact`, `eeo_create_contact`, `eeo_update_project`, …) — reads are
instant, and creates/updates ask the user to confirm first. Leave those two
unset and the agent falls back to operating the page through the widget.

The key is **account-level** (not per-user), so it stays only in this backend's
env, and you should gate which endpoints/users may write. Base URL defaults to
`https://projects.bulleconsulting.com/secure-api/` (override with `EEO_BASE_URL`).

It exposes exactly what the widget speaks:

| Method | Path | Purpose |
|---|---|---|
| POST | `/start` | begin a run: `{ sessionId, prompt, url, title }` |
| GET | `/stream?sessionId=…` | SSE: `activity` \| `tool_call` \| `text` \| `done` \| `error` |
| POST | `/tool-result` | resume: `{ sessionId, id, result }` (or `{ error }`) |

The agent's tools run in the browser, so the backend's ToolRuntime is a proxy:
each `tool_call` is pushed to the widget over SSE, and the run waits for the
matching `/tool-result` before continuing.

## Teaching it your CRM

Edit `CRM_SYSTEM` in `server.mjs` — paste a guide to Bulle Cloud: the main
sections, key pages, and the steps (with exact button/menu labels) to find,
create, and update records. The quickest way to produce that guide is to ask the
BulleBrowser desktop app — logged into the CRM — to explore and describe it, then
paste its summary here.

## Deploy from GitHub (Render)

The backend bundles into one self-contained file, so hosting is small.

```bash
node services/widget-backend/build.mjs     # -> services/widget-backend/dist/server.mjs
node services/widget-backend/dist/server.mjs
```

On **Render** (deploys from your GitHub repo — `render.yaml` here is a ready
blueprint; copy it to the repo root or set these by hand):

- **Build:** `corepack enable && pnpm install --frozen-lockfile && node services/widget-backend/build.mjs`
- **Start:** `node services/widget-backend/dist/server.mjs`
- **Env vars (secrets):** `ANTHROPIC_API_KEY`, `EEO_PUBLIC_ID`, `EEO_SECRET_KEY`, `WIDGET_TOKEN` (any long random string; the widget sends the same value)
- **Env vars (plain):** `EEO_BASE_URL` (defaults to the EEO Secure API), `ALLOWED_ORIGINS`
  — a comma-separated allowlist of every site that embeds the widget
  (`https://projects.bulleconsulting.com`, plus any district dashboard origin).

Railway / a VPS work the same way: `pnpm install`, run the build, start the
bundle, set the env vars. GitHub Pages **cannot** host this — it's static only,
and a secret key can never sit in a public static file.

## ⚠️ Security: the EEO key is account-level

The `X-Secret-Key` can read and write the **whole account**, not just one user's
records. So:

- Put the widget on **authenticated pages** (the EEO Dashboard), where the
  backend can check the caller's session before running.
- If you also embed it on a **public** page (a district dashboard on GitHub
  Pages), anyone who opens that page could drive your CRM through the account
  key. Don't do that without adding an auth check to `/start` first.
- Writes already confirm with the user; keep it that way, and gate which
  endpoints are exposed if some users shouldn't create/update records.

## Not done yet / your call

- **Auth**: the widget calls the backend with `credentials: 'include'`; put your
  CRM's session/SSO check in front of `/start` so only signed-in users run tasks.
- **Destructive actions**: `confirmDestructive` returns `true` in the reference.
  Wire it to a real in-widget confirm before shipping.
- **Hosting + CORS**: lock `Access-Control-Allow-Origin` to your CRM origin.
