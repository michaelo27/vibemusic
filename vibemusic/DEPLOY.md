# Deploy VibeMusic — step by step, $0

Everything below runs on Cloudflare's **free plan**: no credit card, no paid add-on, and the limits reset
daily. There is nothing to cancel.

```
                 ┌─────────────────────────────┐        ┌──────────────────────────────┐
  browser  ───▶  │  Frontend (static export)   │  fetch │  Worker: vibemusic-relayer   │
                 │  Pages  or  Workers assets  │ ─────▶ │  API + relayer + agent brain │
                 └─────────────────────────────┘        └───────────┬──────────────────┘
                                                                    │ reads / writes
                                                ┌───────────────────┴──────────────┐
                                                │  KV namespace: VIBES_KV          │
                                                │  jars · tips · missions          │
                                                └──────────────────────────────────┘
                                                                    │ EIP-712 + transferFrom
                                                                    ▼
                                                        Base mainnet (chainId 8453)
```

You deploy **two things** (the static frontend and the Worker) and the Worker talks to **one** KV
namespace. The agent is either a CLI you run yourself or a cron trigger inside the Worker.

---

## 0 · What it costs (checked Nov 2026)

| Product | Free plan | What VibeMusic uses |
|---|---|---|
| **Workers** | 100,000 requests/day · **10 ms CPU per invocation** · 1 MB gzipped script · 100 Workers | the whole API + relayer; our bundle is **180 KB gzipped** |
| **Workers KV** | 100,000 reads/day · **1,000 writes/day** · 1 GB stored | jars, tips, missions; a mission writes ~4 keys |
| **Static hosting** | static asset requests **free and unmetered**; Pages also allows 500 builds/month, 20,000 files/project | the Next.js export |
| **Cron Triggers** | 5 per account | optional: let the agent tip every 6 h |
| **Custom domain + TLS** | free | optional |

Sources: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[KV limits](https://developers.cloudflare.com/kv/platform/limits/),
[Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

**The one limit that can bite you:** 10 ms of CPU per invocation. Waiting on the network (Audius, Base RPC)
does **not** count — only actual computation does. A mission scores 20-ish tracks, does one ECDSA
recovery, one EIP-712 encode and ~4 KV calls, which normally lands well inside 10 ms. If you ever see
`Error 1102 (Worker exceeded resource limits)`, set `MAX_TIPS_PER_MISSION = "1"`, raise `MIN_SCORE`, or
move to the $5 Workers plan. Billing is capped either way — the free plan returns an error, never a bill.

**Two ways to host the frontend, both $0:**

- **Path A — Cloudflare Pages** (what this repo is already wired for: `public/_redirects`). One command.
  Fully supported.
- **Path B — Workers static assets.** Cloudflare's 2026 recommendation for new projects. One extra config
  file (already committed as `wrangler.static.toml`), then `wrangler deploy`. `_redirects` and `_headers`
  work natively here too.

Pick one; they are interchangeable. Path A is the fewest moving parts.

---

## 1 · Prerequisites

```bash
node -v      # must be 22.x  ← wrangler 4 refuses to run on Node 20
npm -v       # 10.x
git --version
```

If Node is wrong:

```bash
nvm install 22 && nvm use 22        # or: brew install node@22 / winget install OpenJS.NodeJS.LTS
```

Accounts and keys:

1. **Cloudflare account** — free, no card: <https://dash.cloudflare.com/sign-up>
2. **Two wallets on Base** (only for real on-chain tips; the app demos fine without them):
   - **agent wallet** — holds `$VIBES`, holds **no ETH**
   - **relayer wallet** — holds a little **ETH** for gas
3. *Optional:* a free Reown project id if you want mobile WalletConnect QR
   (<https://reown.com/cloud>) — injected wallets need nothing.

---

## 2 · Prove it works locally first

Never debug on production. Five checkpoints, each with the output you should see.

### 2.1 Install

```bash
git clone <your-repo> vibemusic && cd vibemusic
npm install
cd worker && npm install && cd ..
cd agent  && npm install && cd ..
npm run typecheck        # → no output = clean
```

### 2.2 Prototype sanity check (10 seconds)

```bash
open preview/ui-preview.html
```

Landing page + animated pass. Connect a simulated wallet, tip, run a mission, create a jar. If this
breaks, the problem is in the prototype file, not your deployment.

### 2.3 Worker (the backend) — terminal 1

```bash
cd worker
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste two 0x-prefixed 32-byte keys (see §3 if you don't have them yet)
npx wrangler dev --local --port 8787
```

Expected:

```
Using secrets defined in .dev.vars
Your Worker has access to the following bindings:
env.VIBES_KV …  KV Namespace  local
env.MIN_SCORE ("68") …        local
[wrangler:info] Ready on http://localhost:8787
```

Local KV is created automatically — **no Cloudflare login and no real KV id are needed for local dev.**

### 2.4 Four curls that prove the API — terminal 2

```bash
curl -s localhost:8787/api/health  | python3 -m json.tool
curl -s localhost:8787/api/stats   | python3 -m json.tool
curl -s localhost:8787/api/jars    | python3 -m json.tool
curl -s "localhost:8787/api/audius/trending?limit=3" | python3 -m json.tool
```

```json
{ "ok": true, "app": "VibeMusic", "network": "base", "chainId": 8453,
  "token": "0xefFC8815487084a97edfdfF968b56Ea123421Acb",
  "agent": "0x4172…0Cd1",
  "limits": { "maxTipAmount": 100, "minScore": 68, "maxTipsPerMission": 2, "dailySpendCap": 500 } }
```

### 2.5 The 12-check smoke suite

```bash
npm run smoke        # from the repo root, while the Worker is still running
```

```
 ✓ health responds
 ✓ agent wallet matches worker config
 ✓ Audius proxy resolved “iLLPeTiLL - 140 Mix”
 ✓ jar created (/smoke-…)
 ✓ unsigned jar creation rejected (401)
 ✓ relayer verified the EIP-712 signature and asked for allowance
 ✓ replay of the same authorization blocked
 ✓ tampered authorization rejected
 ✓ jar claimed for @Ljazz_beats (/lofi-…)
 ✓ agent signed an EIP-712 authorization
 ✓ mission finished — relay stopped at: the agent wallet has not approved the relayer yet
 All checks passed.
```

That last line is **correct before activation**. Everything up to the on-chain call is proven; the only
missing piece is the one-time `approve` (§3).

### 2.6 Frontend against your local Worker — terminal 3

```bash
cp .env.example .env.local
# in .env.local:
#   NEXT_PUBLIC_API_BASE=http://localhost:8787
npm run dev
```

→ <http://localhost:3000>. Header no longer says demo → data is coming from the Worker.
Test `/@handle` and `/tip/0x…` locally too (dev rewrites point them at the client shells).

**Stop here if any checkpoint failed.** Fix locally; deploying a broken build just moves the problem.

---

## 3 · Create and fund the two wallets

```bash
npm run agent:wallet     # writes agent/.env, prints the agent address
```

1. Copy `AGENT_PRIVATE_KEY` from `agent/.env` into `worker/.dev.vars` (the smoke test checks they match).
2. Generate a **relayer** key the same way (or any fresh wallet) and put it in `worker/.dev.vars` as
   `RELAYER_PRIVATE_KEY`.
3. Fund on **Base mainnet (8453)**:
   - send a little **ETH** (0.002–0.01 is plenty at Base fees) → relayer address
   - send **`$VIBES`** (`0xefFC8815487084a97edfdfF968b56Ea123421Acb`) → agent address
4. One-time approval so the relayer may move the agent's `$VIBES`:

```bash
# local worker
WORKER_URL=http://localhost:8787 npm run agent:activate
WORKER_URL=http://localhost:8787 npm run agent:status
```

`agent:activate` sends a single `approve(relayer, max)` from the agent wallet. After that the agent never
needs ETH again — that is the whole trick of the project.

Re-run the smoke test: the mission now finishes with a **real tx hash** instead of `NEEDS_APPROVAL`.

---

## 4 · Deploy the Worker (the API)

```bash
cd worker
npx wrangler login                     # opens the browser once
```

### 4.1 KV namespace

```bash
npx wrangler kv namespace create VIBES_KV
```

```
[[kv_namespaces]]
binding = "VIBES_KV"
id = "a1b2c3d4e5f6..."                 ← paste this
```

Paste the id into `worker/wrangler.toml` (replacing `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`).

### 4.2 Secrets

```bash
npx wrangler secret put AGENT_PRIVATE_KEY       # paste the agent key
npx wrangler secret put RELAYER_PRIVATE_KEY     # paste the relayer key
```

Secrets are encrypted, never appear in `wrangler.toml`, and are never in git.

### 4.3 Ship it

```bash
npx wrangler deploy
```

```
Total Upload: 914.66 KiB / gzip: 180.07 KiB
Uploaded vibemusic-relayer
Deployed vibemusic-relayer triggers
  https://vibemusic-relayer.<your-subdomain>.workers.dev
```

Sanity-check production:

```bash
curl -s https://vibemusic-relayer.<your-subdomain>.workers.dev/api/health | python3 -m json.tool
```

> **Optional but recommended:** `npx wrangler tail` in a second terminal streams live logs. Leave it open
> while you test the UI — every 4xx/5xx shows up with its stack.

### 4.4 Guardrails already in `wrangler.toml`

| Variable | Default | Meaning |
|---|---|---|
| `MAX_TIP_AMOUNT` | `100` | hard cap per single agent tip |
| `MIN_SCORE` | `68` | quality bar; nothing below it gets paid |
| `MAX_TIPS_PER_MISSION` | `2` | keeps CPU + gas per invocation tiny |
| `DAILY_SPEND_CAP` | `500` | whole `$VIBES` per UTC day |
| `REQUIRE_TIP_JAR` | `true` | only pays wallets that claimed a jar |
| `ALLOWED_ORIGINS` | `*` | tighten in §6 |

---

## 5 · Deploy the frontend

Build first — `NEXT_PUBLIC_*` values are **baked into the HTML at build time**, so set them before
building and rebuild whenever they change.

```bash
cd ..                        # repo root
cp .env.example .env.local
#   NEXT_PUBLIC_API_BASE=https://vibemusic-relayer.<your-subdomain>.workers.dev
#   NEXT_PUBLIC_SITE_URL=https://vibemusic.pages.dev      (or your domain)
#   NEXT_PUBLIC_WC_PROJECT_ID=      (optional)
npm run build                # → out/  (static export + _redirects copied from public/)
```

Inside `out/` you should find `index.html`, `_redirects`, `_next/`. Then pick a path.

### Path A — Cloudflare Pages (1 command, recommended)

```bash
npx wrangler pages deploy out --project-name vibemusic
```

First run creates the project and prints:

```
✨ Success! Uploaded 24 files
✨ Deployment complete! Take a peek over at https://vibemusic.pages.dev
```

`public/_redirects` is inside `out/`, so `/@handle`, `/tip/0x…` and `/0x…` all work immediately.

> Build memory note: `next build` peaks above 1.5 GB. On a small VPS it gets killed
> (`SIGKILL`). Build on your laptop or in CI, or close everything else first.

### Path B — Workers static assets (Cloudflare's 2026 recommendation)

The repo already contains `wrangler.static.toml`:

```toml
name = "vibemusic"
compatibility_date = "2025-06-01"

[assets]
directory = "./out"
```

```bash
npx wrangler deploy -c wrangler.static.toml
# → https://vibemusic.<your-subdomain>.workers.dev
```

`_redirects` and `_headers` are honoured natively by Workers static assets. Static asset requests stay
free and unmetered.

### Optional — custom domain

Dashboard → **Workers & Pages → your project → Custom domains → Set up a domain**. Free TLS, ~1 minute.
Then update `NEXT_PUBLIC_SITE_URL`, rebuild, redeploy, and tighten CORS (§6).

---

## 6 · Wire frontend and Worker together

1. Know your frontend origin (e.g. `https://vibemusic.pages.dev`).
2. In `worker/wrangler.toml`, set `ALLOWED_ORIGINS = "https://vibemusic.pages.dev"` (comma-separate for
   more origins; keep `*` while testing).
3. `npx wrangler deploy` again.
4. Hard-reload the site. DevTools → Network: `/api/*` calls should be 200/201, not blocked.

If you deployed the frontend **before** setting `NEXT_PUBLIC_API_BASE`, the build baked in demo mode —
rebuild and redeploy `out/`.

---

## 7 · First real tip on production

```bash
WORKER_URL=https://vibemusic-relayer.<you>.workers.dev npm run agent:activate   # once
WORKER_URL=https://vibemusic-relayer.<you>.workers.dev npm run agent:status
```

`agent:status` should show: agent `$VIBES` balance, relayer ETH balance, allowance, today's spend.

Now run a mission against production:

```bash
WORKER_URL=https://vibemusic-relayer.<you>.workers.dev npm run agent -- "tip the best chill tracks right now"
```

Expected: a `done` mission with 1–2 tips, each with a tx hash. Open one on Basescan:

```
https://basescan.org/tx/0x…
```

You should see a `transferFrom` from the agent address to the artist's wallet, with the relayer as the
gas payer (`msg.sender` is the relayer contract-call path, ETH fee comes from the relayer, 0 ETH from the
agent).

Also verify from the other side:

```bash
curl -s https://vibemusic-relayer.<you>.workers.dev/api/tips?limit=5 | python3 -m json.tool
curl -s https://vibemusic-relayer.<you>.workers.dev/api/stats | python3 -m json.tool
```

and in the browser: open the artist's `/@handle` page — the tip should be in the list with its reason
string, and the agent console should show the mission.

---

## 8 · Optional $0 extras

**Let the agent run itself.** In `worker/wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]     # every 6 hours
```

`npx wrangler deploy` → the Worker now tips on a schedule with no CLI running. Cron triggers are free
(5 per account). Budget check: one mission = ~1 Worker invocation + ~4 KV writes; 4/day is ~120 KV writes
a day against the 1,000/day free limit.

**Auto-deploy on push.** Either connect the repo in the Pages dashboard (framework preset: Next.js,
build `npm run build`, output `out`), or add a GitHub Action:

```yaml
# .github/workflows/deploy.yml
name: deploy
on: { push: { branches: [main] } }
jobs:
  ship:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npm ci --prefix worker
      - run: npm run build
        env:
          NEXT_PUBLIC_API_BASE: ${{ secrets.API_BASE }}
          NEXT_PUBLIC_SITE_URL: ${{ secrets.SITE_URL }}
      - run: npx wrangler pages deploy out --project-name vibemusic
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 9 · Verification matrix (run this after every deploy)

| # | Check | Pass looks like |
|---|---|---|
| 1 | `curl /api/health` | `ok:true`, `chainId:8453`, correct `agent` address |
| 2 | Site loads | landing page with the animated pass, no console errors |
| 3 | Console→Network | `/api/jars` 200, no CORS errors |
| 4 | Create a jar in the UI | redirected to `/@your-handle`, jar appears on home |
| 5 | Tip with a real wallet | wallet signature → tx on Basescan → tip in `/api/tips` |
| 6 | `npm run smoke` against prod | `All checks passed` |
| 7 | Agent mission | `done`, 1–2 tips, tx hashes resolve on Basescan |
| 8 | `npx wrangler tail` | no 5xx during the above |
| 9 | `/@handle`, `/tip/0x…`, `/0x…` | all serve the jar page (not 404) |
| 10 | Free-tier sanity | dashboard → Workers → metrics: requests/day, KV writes/day well under caps |

---

## 10 · Ops

```bash
npx wrangler tail                                   # live logs
npx wrangler deployments list                       # what's live
npx wrangler rollback                               # undo the last deploy
npx wrangler kv key list --namespace-id <id>        # inspect stored keys
npx wrangler pages deployment list --project-name vibemusic
```

Kill switch: set `DAILY_SPEND_CAP = "0"` (or `REQUIRE_TIP_JAR = "true"` with no jars) and redeploy — the
agent stops paying immediately without touching code.

---

## 11 · Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Wrangler requires at least Node.js v22.0.0` | `nvm use 22` — the most common failure by far |
| `Could not resolve "viem/chains"` on deploy | dependencies missing: `cd worker && npm install` |
| `Error 1027` in the browser | Workers free daily request cap (100k) hit — resets 00:00 UTC |
| `Error 1102` / worker killed | exceeded 10 ms CPU — set `MAX_TIPS_PER_MISSION="1"`, raise `MIN_SCORE` |
| `KV PUT failed: 429` / writes rejected | KV free cap (1,000 writes/day) — reduce mission frequency |
| API 500 `Missing AGENT_PRIVATE_KEY` | `npx wrangler secret put AGENT_PRIVATE_KEY` (secrets are per-Worker, not in `wrangler.toml`) |
| `NEEDS_APPROVAL` in prod | `WORKER_URL=https://… npm run agent:activate` |
| `INSUFFICIENT_VIBES` | fund the **agent** address with `$VIBES` |
| `NO_JAR` | `REQUIRE_TIP_JAR="true"` and the artist never claimed a jar — claim one, or set `false` |
| CORS error in console | `ALLOWED_ORIGINS` must match the exact origin incl. scheme; redeploy the Worker |
| Site shows demo data after deploying | `NEXT_PUBLIC_API_BASE` was empty at build time — set it, `npm run build`, redeploy `out/` |
| `/@handle` 404 on Pages | `_redirects` missing from `out/` — it comes from `public/`; rebuild |
| `/@handle` 404 on Workers assets | same file, but the assets dir must be the deploy root (`./out`) |
| Wallet connect does nothing | injected wallet + a normal browser tab; sandboxed iframes block extensions |
| RainbowKit only offers QR | set `NEXT_PUBLIC_WC_PROJECT_ID` |
| `next build` killed (SIGKILL) | not enough RAM (needs ~2 GB) — build locally/CI or raise swap |

---

## 12 · Definition of done

- [ ] `npm run smoke` passes against **production**, not just localhost
- [ ] Landing page live on an `https://` URL with the animated pass
- [ ] A jar created through the UI is visible at `/@handle` **and** in `/api/jars`
- [ ] One real tip from a human wallet, visible on Basescan
- [ ] One real tip from the agent, visible on Basescan, gas paid by the relayer
- [ ] `ALLOWED_ORIGINS` locked to your domain
- [ ] `DAILY_SPEND_CAP` and `MAX_TIP_AMOUNT` set to amounts you are comfortable losing
- [ ] `npx wrangler tail` clean during a full pass
- [ ] README links point at the live URL

---

### Local-only version of this document

`LOCAL.md` covers running the whole stack on your machine (including demo mode and the prototype).
This file is the deployment half.
