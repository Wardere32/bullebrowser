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

```html
<script src="https://bullebrowser.com/widget.js"></script>
<script>
  BulleBrowser.init({
    endpoint: 'https://YOUR-BACKEND',       // where server.mjs is hosted
    title: 'BulleBrowser',
    accent: '#2563EB',
    greeting: 'Ask me to do anything in the CRM.'
  });
</script>
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

## Not done yet / your call

- **Auth**: the widget calls the backend with `credentials: 'include'`; put your
  CRM's session/SSO check in front of `/start` so only signed-in users run tasks.
- **Destructive actions**: `confirmDestructive` returns `true` in the reference.
  Wire it to a real in-widget confirm before shipping.
- **Hosting + CORS**: lock `Access-Control-Allow-Origin` to your CRM origin.
