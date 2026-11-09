# Run VibeMusic locally

> Deploying? **[`DEPLOY.md`](DEPLOY.md)** is the step-by-step $0 hosting guide (Cloudflare KV → secrets →
> Worker → frontend → first real tip). This file is the local half: prototype, demo mode, full stack.

Four levels. Pick the one you need — you never have to do all of them.

| Level | What you get | Time | Needs |
|---|---|---|---|
| **A** | The prototype UI — one HTML file | 10 seconds | a browser |
| **B** | The real Next.js app, demo mode (no backend) | ~3 min | Node 22, npm |
| **C** | Full stack: Next.js + Cloudflare Worker + agent CLI | ~10 min | Node 22, npm |
| **D** | Deployed to Cloudflare (free tier) | ~15 min | + a free Cloudflare account |

> **Node version matters.** The Worker tooling (`wrangler` 4.x) **requires Node 22 or newer** — it exits
> with `Wrangler requires at least Node.js v22.0.0` on Node 20. Next.js 15 wants ≥ 18.18. Use Node 22
> for everything and you cannot go wrong:
>
> ```bash
> nvm install 22 && nvm use 22     # or: brew install node@22
> node -v                          # → v22.x
> ```

---

## A · Prototype (no install)

```bash
open preview/ui-preview.html        # macOS
start preview\ui-preview.html       # Windows
xdg-open preview/ui-preview.html    # Linux
```

Prefer a local server (needed if you want a real browser wallet to connect):

```bash
python3 -m http.server 4000
# → http://localhost:4000/preview/ui-preview.html
```

Click **Connect wallet** → the *Browser wallet* row does a real `eth_requestAccounts` on Base. If it is
greyed out, the page has no injected provider: install MetaMask (or Rabby/Coinbase Wallet) and load the
page over `http://` or a normal tab — extensions are blocked inside sandboxed preview frames.

Simulated wallets work everywhere, offline, and move no funds — use them to click through tipping, jar
creation and agent missions.

---

## B · Real app, demo mode (frontend only)

Demo mode is auto-selected whenever `NEXT_PUBLIC_API_BASE` is empty. Everything is real UI + real
scoring, but storage is `localStorage` and chain writes are simulated — no Worker, no keys.

```bash
# from the repo root
npm install
cp .env.example .env.local
# leave NEXT_PUBLIC_API_BASE empty in .env.local
npm run dev
```

→ **http://localhost:3000**

Checklist:

1. Landing page renders; header shows the demo badge.
2. **Create** → publish a jar (needs a wallet: install MetaMask, nothing is actually signed in demo mode).
3. Open your jar → tip `25 VIBES` → the balance and the tip list update.
4. Home → **Run mission** → the agent scores the catalogue and the receipts appear.
5. `http://localhost:3000/@your-handle` and `http://localhost:3000/tip/0x…` both work — in `next dev`
   they are rewritten to the client shells; in production `public/_redirects` does the same job.

Stop with `Ctrl-C`. Reset demo data with the **reset** button (or `localStorage.clear()` in devtools).

---

## C · Full stack locally (frontend + Worker + agent)

Three terminals. The Worker on **:8787**, the app on **:3000**, the agent CLI wherever you like.

### C1 — Worker (terminal 1)

```bash
cd worker
npm install
cp .dev.vars.example .dev.vars        # then paste real keys into .dev.vars
npx wrangler dev --local --port 8787
```

Local KV is created automatically — you do **not** need a real `VIBES_KV` id or a Cloudflare login to
develop. You should see the bindings table:

```
Your Worker has access to the following bindings:
env.VIBES_KV …            KV Namespace   local
env.MIN_SCORE ("68")      …              local
env.AGENT_PRIVATE_KEY ("(hidden)")
env.RELAYER_PRIVATE_KEY ("(hidden)")
[wrangler:info] Ready on http://localhost:8787
```

Keys for `.dev.vars`:

```bash
npm run agent:wallet      # creates agent/.env, prints the agent address to fund with $VIBES
# paste the same key into worker/.dev.vars as AGENT_PRIVATE_KEY (the smoke test checks they match)
# RELAYER_PRIVATE_KEY is a second wallet that holds a little ETH and pays gas
```

Smoke-check it before touching the UI:

```bash
curl -s localhost:8787/api/health | python3 -m json.tool
```

```json
{
  "ok": true, "app": "VibeMusic", "network": "base", "chainId": 8453,
  "token": "0xefFC8815487084a97edfdfF968b56Ea123421Acb",
  "agent": "0x4172…0Cd1",
  "limits": { "maxTipAmount": 100, "minScore": 68, "maxTipsPerMission": 2, "dailySpendCap": 500 }
}
```

Other endpoints worth poking:

```bash
curl -s localhost:8787/api/stats
curl -s localhost:8787/api/jars
curl -s "localhost:8787/api/audius/trending?limit=3"
```

### C2 — Frontend pointed at the Worker (terminal 2)

```bash
# repo root
cp .env.example .env.local
# in .env.local:
#   NEXT_PUBLIC_API_BASE=http://localhost:8787
npm run dev
```

→ **http://localhost:3000**. The header should no longer say demo — data now comes from the Worker
(`IS_DEMO` is false as soon as `NEXT_PUBLIC_API_BASE` is set).

### C3 — Agent CLI and the smoke suite (terminal 3)

```bash
# repo root
npm run smoke                 # 12 checks, runs against http://localhost:8787
npm run agent -- "tip the best chill tracks right now"
```

`npm run smoke` is the fastest way to know your Worker is healthy. A good run looks like this
(this is real output from a local Worker):

```
 VibeMusic worker smoke test
  · target http://127.0.0.1:8787
  ✓ health responds
  · signing as 0x4172…0Cd1
  ✓ agent wallet matches worker config
  ✓ Audius proxy resolved “iLLPeTiLL - 140 Mix”
  ✓ jar created (/smoke-0ongk)
  ✓ unsigned jar creation rejected (401)
  ✓ relayer verified the EIP-712 signature and asked for allowance
  ✓ replay of the same authorization blocked
  ✓ tampered authorization rejected
  ✓ jar claimed for @Ljazz_beats (/lofi-0onvt)
  ✓ agent signed an EIP-712 authorization (23 scanned, 0 settled)
  ✓ mission finished — relay stopped at: the agent wallet has not approved the relayer yet

 All checks passed.
```

That last line is expected **before** activation. To get real on-chain tips you need two funded wallets:

```bash
# 1. send a little ETH on Base to the RELAYER address (gas)
# 2. send $VIBES on Base to the AGENT address (the tips)
npm run agent:activate    # one-time approve(relayer, max) from the agent wallet
npm run agent:status      # balances, allowance, daily spend
```

After activation the same mission returns `settled` receipts with real tx hashes.

### C4 — Typecheck everything

```bash
npm run typecheck     # root + worker + agent, tsc --noEmit
```

---

## D · Deploy to Cloudflare (free)

Order matters: KV → worker → secrets → deploy → frontend → activate.

```bash
# 1. log in once
cd worker && npx wrangler login

# 2. create the KV namespace, then paste the printed id into wrangler.toml
npx wrangler kv namespace create VIBES_KV
#    [[kv_namespaces]]
#    binding = "VIBES_KV"
#    id = "<paste me>"

# 3. secrets (never in wrangler.toml, never committed)
npx wrangler secret put AGENT_PRIVATE_KEY
npx wrangler secret put RELAYER_PRIVATE_KEY

# 4. ship the API
npx wrangler deploy
# → https://vibemusic-relayer.<your-subdomain>.workers.dev
```

```bash
# 5. build the static frontend against the deployed worker
cd ..                        # repo root
cp .env.example .env.local
#   NEXT_PUBLIC_API_BASE=https://vibemusic-relayer.<your-subdomain>.workers.dev
#   NEXT_PUBLIC_SITE_URL=https://<project>.pages.dev
#   NEXT_PUBLIC_WC_PROJECT_ID=<optional, free at reown.com/cloud — only for mobile QR>
node -v && npm run build     # emits out/

# 6. publish (public/_redirects is already inside out/)
npx wrangler pages deploy out --project-name vibemusic
# → https://vibemusic.pages.dev
```

```bash
# 7. once the Pages URL exists, lock CORS down and re-deploy the worker
#    worker/wrangler.toml →  ALLOWED_ORIGINS = "https://vibemusic.pages.dev"
cd worker && npx wrangler deploy

# 8. activate the agent against production
cd .. && WORKER_URL=https://vibemusic-relayer.<your-subdomain>.workers.dev npm run agent:activate
WORKER_URL=https://vibemusic-relayer.<your-subdomain>.workers.dev npm run agent:status
```

Post-deploy verification:

```bash
curl -s https://vibemusic-relayer.<you>.workers.dev/api/health | python3 -m json.tool
curl -s https://vibemusic-relayer.<you>.workers.dev/api/stats
# then in a browser:
#   https://<project>.pages.dev/                 landing
#   https://<project>.pages.dev/@your-handle     public jar  (served by _redirects → /u/index.html)
#   https://<project>.pages.dev/tip/0x…          vanity wallet URL
```

Optional: uncomment `[triggers] crons = ["0 */6 * * *"]` in `worker/wrangler.toml` and `npx wrangler
deploy` again — the agent then runs itself every 6 hours.

**Build memory:** `next build` peaks above 1.5 GB. On a 2 GB box it gets OOM-killed
(`Next.js build worker exited with code: null and signal: SIGKILL`). If that happens, build on your
laptop or in CI, or close everything else and run
`NODE_OPTIONS=--max-old-space-size=4096 npm run build` with enough free RAM. `next dev` is much lighter
and is the right loop for iterating.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Wrangler requires at least Node.js v22.0.0` | `nvm use 22` (this is the single most common one) |
| `EADDRINUSE :8787` | `lsof -ti:8787 \| xargs kill` then restart, or `--port 8788` + update `NEXT_PUBLIC_API_BASE` |
| Worker boots but `curl` gets nothing | wait for `Ready on http://localhost:8787`; the first boot compiles the Worker |
| Browser console: CORS blocked | set `ALLOWED_ORIGINS` in `worker/wrangler.toml` to your origin (`*` for the hackathon) |
| `NEEDS_APPROVAL` | run `npm run agent:activate` once (one-time `approve`) |
| `INSUFFICIENT_VIBES` | fund the **agent** address with `$VIBES` on Base |
| `NO_JAR` on a mission | the artist never claimed a jar — set `REQUIRE_TIP_JAR = "false"` to test, or claim one in the UI |
| `SLUG_TAKEN` | that handle is used; pick another |
| `REPLAY` / `BAD_SIGNATURE` / `EXPIRED` | the authorization was reused, tampered with, or older than its deadline — expected rejections |
| RainbowKit shows a QR-only flow | set `NEXT_PUBLIC_WC_PROJECT_ID` (free at reown.com/cloud); injected wallets need no id |
| `404` on `/@handle` in `next dev` | hit `/u/?h=handle` directly, or restart dev so the rewrites reload |
| Deployed `/@handle` 404s | `_redirects` must be inside `out/` — it ships from `public/`; redeploy `out` |
| Empty landing page, no errors | `NEXT_PUBLIC_API_BASE` points at a dead Worker → frontend falls back to errors; check `/api/health` |
| Real wallet option greyed out in the prototype | sandboxed iframe or no extension — open `preview/ui-preview.html` over http in a normal tab |

---

## What was actually verified (and where)

Run inside this workspace, so you can trust these lines:

| Check | Result |
|---|---|
| `cd worker && npm install` + `npx wrangler dev --local --port 8787` | ✅ boots, bindings table printed |
| `curl localhost:8787/api/health` · `/api/stats` · `/api/jars` | ✅ JSON as shown above |
| `npm run smoke` (12 agent/relayer checks) | ✅ **All checks passed** |
| `cd agent && npx tsx src/index.ts "<mission>"` | ✅ signs + posts, stops at `NEEDS_APPROVAL` until activation |
| `tsc --noEmit` root + worker + agent | ✅ clean |
| `next dev` / `next build` on this box | ⚠️ **cannot run here** — 2 GB RAM, no swap, webpack is OOM-killed. Run it on your machine. |
| Real on-chain tip | ⚠️ needs funded agent + relayer wallets; not executed here |
