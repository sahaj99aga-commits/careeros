# CornerPost

**A week of social + Google Business posts for a local business — written in their voice, every week.** Recurring, low-effort content on autopilot for plumbers, gyms, salons, cafes, and any local service business.

Owners answer a few questions once (their services, tone, city, current offer), and CornerPost generates a full week of ready-to-post content across Instagram, Facebook, and Google Business Profile. They review, tweak, approve, and ship.

---

## Two ways it runs

CornerPost works in two modes, and **flips between them automatically**:

| Mode | When | What happens |
|---|---|---|
| **Demo** | No API key set | Posts are produced by a built-in, offline template engine. Fully functional, zero cost — great for showing a prospect. |
| **AI** | An Anthropic API key is set | Every post is genuinely written by Claude in the business's voice. This is the real product. |

The app shows an **"AI on / Demo"** badge in the top bar so you always know which mode you're in. If the AI ever errors or the server is offline, it silently falls back to the template engine — **the app never breaks.**

---

## Quick start (for you, the seller)

You need [Node.js](https://nodejs.org) 18 or newer. No other dependencies — nothing to `npm install`.

### 1. Run the demo (no key)

```bash
node server.js
```

Open **http://localhost:3000**. It runs in Demo mode. This is enough to show a client what they'll get.

### 2. Turn on real AI (drop in the key)

```bash
cp .env.example .env
```

Open `.env`, paste your Anthropic API key after `ANTHROPIC_API_KEY=`, save, and restart:

```bash
node server.js
```

That's it. The badge flips to **AI on** and every generated post is now written by Claude. **No code changes — just the key.**

Get a key at **https://console.anthropic.com** → API Keys.

---

## Cost

Each post is a few hundred tokens. On the default model (**Claude Haiku 4.5**), a business posting ~5×/week costs you a few **cents per month** in API usage. Charge them a monthly subscription and the inference cost is a rounding error.

Want higher-quality copy? Change one line in `.env`:

```
ANTHROPIC_MODEL=claude-opus-4-8    # richest copy
ANTHROPIC_MODEL=claude-sonnet-5    # strong middle ground
ANTHROPIC_MODEL=claude-haiku-4-5   # default: fast + cheap
```

---

## Selling to a client

Each client is a self-contained copy of this folder with its **own key in its own `.env`**. Because the key lives only on the server (never in the browser), it is never exposed to the business's customers or anyone using the app.

Typical setup: deploy one instance per client (or run it for them), set their key, and set their brand voice once under **Brand Voice**. From then on, every week generates itself.

---

## What's in the box

```
index.html        App shell
css/styles.css    Design system + component styles
js/icons.js       Icon set
js/generator.js   The content engine: business-type content banks, tone,
                  platform formatting, AND the AI/template switch
js/store.js       Data layer (brand voice, channels, cadence, post lifecycle)
js/components.js  UI primitives (modal, toast, form fields, progress ring)
js/app.js         Views + routing (Dashboard, This Week, Library,
                  Brand Voice, Schedule)
server.js         Zero-dependency Node server: serves the app + proxies
                  generation to Claude (holds the key server-side)
.env.example      Copy to .env and add your key
```

### The two API endpoints (server.js)

- `GET /api/status` → `{ configured: <bool>, model }` — the app uses this to set the badge.
- `POST /api/generate` → generates one post or a whole week. Returns `{ configured: false }` when no key is set so the frontend falls back to templates.

---

## Notes

- **Data** (brand voice, generated posts, schedule) is stored per-browser in `localStorage`. It's a self-contained front end — no database required.
- **The key is never sent to the browser.** Only `server.js` reads it. `.env` is git-ignored.
- Opening `index.html` directly (via `file://`, no server) also works — it just stays in Demo mode.
