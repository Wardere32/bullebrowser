# BulleBrowser beta gateway

A vendor-funded, metered proxy so staff can run BulleBrowser with **no API key of their own**. It holds your Anthropic/OpenAI keys as Cloudflare **secrets** (never in the client), gives each install a free allowance (default **15 prompts**), then returns `402` so the app falls back to bring-your-own-key.

## Why this exists

BulleBrowser ships from a **public** releases page, so any key embedded in the app is extractable by anyone who downloads it. Keeping the key here — behind metering and spend caps — is the only safe way to offer a keyless beta. No production key ever lives in the client.

## Deploy (~5 minutes)

Prereqs: a Cloudflare account, `npm i -g wrangler`, then `wrangler login`.

```bash
cd services/gateway

# 1. Create the metering store, then paste its id into wrangler.toml (kv_namespaces.id)
wrangler kv namespace create METER

# 2. Add your provider keys as secrets (never committed)
wrangler secret put ANTHROPIC_API_KEY   # paste sk-ant-...
wrangler secret put OPENAI_API_KEY       # paste sk-...   (also powers Whisper voice)

# 3. Ship it
wrangler deploy
```

Wrangler prints your URL, e.g. `https://bullebrowser-gateway.<subdomain>.workers.dev`. Confirm it's alive:

```bash
curl https://bullebrowser-gateway.<subdomain>.workers.dev/health   # -> {"ok":true,...}
```

**Then send me that URL** and I'll wire the desktop app to it — beta runs with no user key, and falls back to "add your key" once the free allowance is used.

## Tunables (`wrangler.toml` → `[vars]`)

- `FREE_PROMPTS` — free prompts per install before it asks for a key (default 15)
- `DAILY_IP_LIMIT`, `MONTHLY_GLOBAL_LIMIT` — abuse / spend backstops
- The app sends the model, so keep the beta on a cheap model (e.g. Haiku / gpt-4o-mini) to keep cost near zero.

## Cost control

Every free prompt is billed to your key. As the ultimate backstop, set a **hard monthly spend limit** in your Anthropic and OpenAI billing dashboards, and keep `MONTHLY_GLOBAL_LIMIT` modest. For internal staff use the caps here are more than enough; the global cap is what protects you if the public download drives unexpected traffic.

## Request contract (what the app sends)

- `POST /v1/anthropic/v1/messages` — Anthropic SDK `baseURL = <gateway>/v1/anthropic`
- `POST /v1/openai/v1/chat/completions` — OpenAI chat
- `POST /v1/openai/v1/audio/transcriptions` — Whisper voice
- headers: `x-bulle-install: <per-install uuid>`, `x-bulle-turn: <per-prompt id>`

The Worker meters distinct `x-bulle-turn` values per `x-bulle-install` (one prompt = many model calls, counted once), proxies to the provider with the real key, and streams the response back unchanged.
