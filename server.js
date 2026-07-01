/* ============================================================================
   CornerPost server — serves the app and proxies content generation to Claude.
   Zero dependencies (Node 18+ built-ins only). The Anthropic API key lives
   here, server-side, and is never sent to the browser. If no key is set the
   app still works: the frontend falls back to its built-in template engine.

   Setup:  1) copy .env.example to .env and paste your key
           2) node server.js
           3) open http://localhost:3000
   ============================================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

/* ----------  Minimal .env loader (no dependency)  ---------- */
(function loadEnv() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    raw.split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) return;
      let val = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = val;
    });
  } catch (e) { /* no .env file — that's fine, demo mode */ }
})();

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
// Haiku 4.5 is the cost-smart default for high-volume, short social posts
// (pennies per business per month). Bump to claude-opus-4-8 for richer copy.
const MODEL = (process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5').trim();
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

/* ----------  Static file serving  ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(__dirname, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ----------  Prompt construction  ---------- */
const PLATFORM_RULES = {
  instagram: 'Instagram caption. Punchy and scroll-stopping. A few tasteful emojis. 2–4 short lines with line breaks. Provide 5–8 relevant hashtags (mix of local + niche). No phone numbers.',
  facebook: 'Facebook post. Warm and conversational, like talking to a neighbor. A little longer than Instagram. End with a question to spark comments. At most 2–3 hashtags.',
  google: 'Google Business Profile post. Concise (under ~700 characters), locally-worded, and keyword-rich for local SEO. Include the city/area if provided. NO hashtags, NO emojis. Clear call to action. Provide a short button label in "cta" (e.g. "Call now", "Book online", "Learn more").',
};
const TYPE_BRIEF = {
  tip: 'A genuinely useful expert tip that positions the business as the trusted local pro.',
  promo: 'Promote the current offer with light urgency. If no offer is given, invent a reasonable, modest first-time-customer incentive.',
  seasonal: 'Tie into the current season and what customers need right now.',
  review: 'Politely ask happy customers to leave a Google review, explaining it helps neighbors find them.',
  testimonial: 'Spotlight a (plausible, non-fabricated-sounding) happy-customer result or quote.',
  faq: 'Answer one common customer question in a friendly Q&A format.',
  story: 'A short behind-the-scenes / meet-the-team moment that feels authentic and human.',
  community: 'Local pride — celebrate the neighborhood and the value of shopping small/local.',
};

function buildMessages(business, slots) {
  const b = business || {};
  const bizBlock = JSON.stringify({
    name: b.name, type: b.type, city: b.city, tagline: b.tagline,
    tone: b.tone, services: b.services, offer: b.offer,
    phone: b.phone, website: b.website, targetCustomer: b.targetCustomer,
  }, null, 2);

  const plan = slots.map((s, i) =>
    `Post ${i + 1}: platform="${s.platform}" (${PLATFORM_RULES[s.platform] || ''}) | angle="${s.type}" — ${TYPE_BRIEF[s.type] || ''}`
  ).join('\n');

  const system =
    'You are an expert social media copywriter for local service businesses (plumbers, gyms, salons, cafes, and the like). ' +
    'You write in the authentic, specific voice of the business owner — never generic "AI slop", never corporate filler. ' +
    'You respect each platform\'s norms exactly. You never invent fake statistics, fake awards, or fake named testimonials. ' +
    'You match the requested tone: friendly, professional, bold, or playful.';

  const user =
    `Here is the business:\n${bizBlock}\n\n` +
    `Write the following ${slots.length} post(s), each in the business's voice:\n${plan}\n\n` +
    'Respond with ONLY a JSON array (no prose, no markdown fences). Each element must be an object with exactly these keys:\n' +
    '  "body": the full post text (use real line breaks),\n' +
    '  "hashtags": array of hashtag strings including the # (empty array for Google Business),\n' +
    '  "cta": a short button label for Google Business posts, otherwise "",\n' +
    '  "imageIdea": one sentence describing the photo the owner should pair with it.\n' +
    'Return the array in the same order as the posts above.';

  return { system, user };
}

function extractJson(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim();
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

async function callClaude(business, slots) {
  const { system, user } = buildMessages(business, slots);
  const resp = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: Math.min(4096, 400 + slots.length * 400),
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Anthropic API ${resp.status}: ${detail.slice(0, 300)}`);
  }
  const data = await resp.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const arr = extractJson(text);
  if (!Array.isArray(arr)) throw new Error('Model did not return an array');
  return arr;
}

/* ----------  Request handling  ---------- */
function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/status') {
    return sendJson(res, 200, { configured: !!API_KEY, model: API_KEY ? MODEL : null });
  }

  if (req.url === '/api/generate' && req.method === 'POST') {
    if (!API_KEY) return sendJson(res, 200, { configured: false });
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const business = payload.business || {};
        const slots = Array.isArray(payload.plan) && payload.plan.length
          ? payload.plan
          : [{ type: payload.type || 'tip', platform: payload.platform || 'instagram' }];
        const posts = await callClaude(business, slots);
        if (payload.plan) return sendJson(res, 200, { configured: true, posts });
        return sendJson(res, 200, { configured: true, post: posts[0] });
      } catch (err) {
        console.error('[generate]', err.message);
        // Signal failure; the frontend transparently falls back to templates.
        return sendJson(res, 502, { configured: true, error: err.message });
      }
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  CornerPost running →  http://localhost:${PORT}`);
  console.log(API_KEY
    ? `  AI copy: ON  (model: ${MODEL})`
    : `  AI copy: OFF (demo mode) — add ANTHROPIC_API_KEY to .env to enable real generation`);
  console.log('');
});
