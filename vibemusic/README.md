# ⚡ VibeMusic

**Tip jars for Audius artists, paid in `$VIBES` on Base — by humans, and by an autonomous agent that never sleeps.**

VibeMusic is a single-page app where artists link 1–3 Audius tracks and get a public tip jar.
Fans tip in one click. An AI agent independently discovers tracks it thinks are *nice*, explains
why in plain English, and pays the artist in real `$VIBES` — **without ever holding ETH**, because a
Cloudflare Worker relayer sponsors every unit of gas.

> Built for **Vibestarter Vibeathon 02** · Base mainnet · Cloudflare free tier only · $0 to run.
>
> 🖼 **Interactive prototype:** open [`preview/ui-preview.html`](preview/ui-preview.html) in any browser.
> One self-contained file, no install, no keys, no network. The landing page is built around a single
> **animated tip pass** — it floats, tilts toward your cursor with a moving specular sheen, runs a live
> waveform and a holographic medallion ring, and links straight into the featured jar. Light theme by
> default with a dark toggle, a wallet-connect modal (your real injected wallet on Base when one is
> present, plus simulated wallets so every screen is clickable offline), the full tip flow, jar creation,
> and the agent mission runner that scores a baked-in 14-track Audius catalogue with the same 68/100 rule
> before it signs and relays. Screenshots in [`preview/screenshots/`](preview/screenshots); 65 jsdom
> click-through checks in [`preview/tests/`](preview/tests).

| | |
|---|---|
| **Frontend** | Next.js 15 (App Router, static export) on **Cloudflare Pages** |
| **Backend** | one **Cloudflare Worker** (API + relayer + agent runtime) |
| **Storage** | **Cloudflare KV** |
| **Music data** | **Audius** public REST API (keyless) |
| **Money** | `$VIBES` ERC-20 `0xefFC8815487084a97edfdfF968b56Ea123421Acb` on **Base** |
| **Wallets** | wagmi v2 + viem + RainbowKit |

---

## Table of contents

1. [The 60-second pitch](#the-60-second-pitch)
2. [How the agentic payment works](#how-the-agentic-payment-works)
3. [Repo layout](#repo-layout)
4. [Run it locally (5 minutes)](#run-it-locally-5-minutes)
5. [The agent wallet: fund it, activate it](#the-agent-wallet-fund-it-activate-it)
6. [Deploy to Cloudflare ($0)](#deploy-to-cloudflare-0)
7. [Environment variables](#environment-variables)
8. [API reference](#api-reference)
9. [Data model (KV)](#data-model-kv)
10. [The agent brain (scoring rules)](#the-agent-brain-scoring-rules)
11. [Demo script for judges](#demo-script-for-judges)
12. [Cost & free-tier maths](#cost--free-tier-maths)
13. [Security & production hardening](#security--production-hardening)
14. [Troubleshooting](#troubleshooting)

---

## The 60-second pitch

1. **Artists** connect a wallet → create a jar (name, bio, X, avatar) → paste up to 3 Audius links.
   Audius metadata, artwork and streamable previews are fetched and stored.
   Their public page lives at **`/@handle`** or **`/tip/0xwallet`**.
2. **Fans** hit `10 / 25 / 50 / 100 VIBES` (or a custom amount), add a message, and sign one
   ERC-20 `transfer`. Money goes wallet → wallet. No custody, no platform cut.
3. **The agent** gets a mission in plain English — *"Tip the best chill tracks right now"*. It
   pulls trending + genre + search results from Audius, **scores every track 0–100** with
   deterministic rules (genre fit, mood fit, engagement, craft, freshness, hidden-gem bonus), keeps
   the best few, matches the artist's Audius handle to a claimed **tip jar**, signs an **EIP-712
   authorization**, and posts it to the Worker. The Worker verifies the signature and executes
   `transferFrom(agent → artist)` **with the relayer's ETH**. The agent holds `$VIBES` only.
4. **Everything is public**: an agent activity feed shows every tip with the human-readable reason
   it was made, plus a BaseScan link.

Two entry points, one brain:

* `POST /api/agent/run` → the Worker runs a mission itself (this is what the UI buttons call).
* `POST /api/agent/tip` → **any external agent** can post an EIP-712-signed authorization.
  `agent/` contains a standalone CLI agent that does exactly this, proving the payment rail is real
  agent-to-agent infrastructure, not a UI trick.

---

## How the agentic payment works

```
                      ① discover                ② judge (rules)            ③ sign (off-chain)
  ┌──────────────┐   GET /tracks/trending   ┌──────────────────┐      ┌────────────────────────┐
  │  Audius API  │ ───────────────────────► │  Agent runtime   │ ───► │ EIP-712 TipAuthorization│
  └──────────────┘   GET /tracks/search     │  (Worker or CLI) │      │  signed by agent wallet │
                                            └──────────────────┘      └───────────┬────────────┘
                                                                                   │ POST /api/agent/tip
                                                                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                       Cloudflare Worker  (relayer, holds a little ETH)              │
  │  1. verify signature (viem verifyTypedData)   4. VIBES.transferFrom(agent → artist) │
  │  2. replay check (KV nonce)                   5. wait for the receipt               │
  │  3. allowance / balance / spend-cap checks    6. write the tip + reason to KV       │
  └─────────────────────────────────────────────────────────────────────────────────────┘
                                                                                   │
                                                              $VIBES ──────────────┴──► artist wallet
                                                              gas ─────────────────────► relayer
```

**The agent wallet needs zero ETH.** It signs a message (free) and the relayer broadcasts the
transaction. `$VIBES` (Vibestarter) is a plain ERC-20 with no EIP-2612 `permit`, so the relayer's
ability to pull funds is granted by **one** `approve` transaction — see
[activation](#the-agent-wallet-fund-it-activate-it). After that single setup transaction, every tip
the agent makes is gasless.

### Safety rails on the relayer (all in `worker/wrangler.toml`)

| Rail | Default |
|---|---|
| Max `$VIBES` per single agent tip | `100` |
| Daily spend cap (per agent, UTC day, KV counter) | `500` |
| Replay protection | `(agent, nonce)` claimed once in KV, 7-day TTL |
| Authorization expiry window | ≤ 1 hour, must not be in the past |
| Recipient must have claimed a jar | `true` |
| Only the configured agent key may sign | enforced (`WRONG_SIGNER`) |
| Quality bar | score ≥ `68/100` |

Human tips are also verified on-chain: `POST /api/tips` re-reads the receipt and requires a matching
`Transfer(from → to, amount)` log from the `$VIBES` contract before it writes anything.

---

## Repo layout

```
.
├── src/                        # Next.js 15 app (App Router, static export → Cloudflare Pages)
│   ├── app/
│   │   ├── page.tsx            # discovery / "let the agent cook" / feeds
│   │   ├── create/page.tsx     # tip jar creation
│   │   ├── agent/page.tsx      # agent console: wallet, allowance, missions, log
│   │   ├── tip/page.tsx        # public jar shell  (/tip/0x… rewritten here)
│   │   └── u/page.tsx          # public jar shell  (/@handle rewritten here)
│   ├── components/             # UI kit + feature components (agent-cook, tip-panel, …)
│   └── lib/
│       ├── api.ts              # one data layer: LIVE (Worker) or DEMO (localStorage)
│       ├── demo.ts             # demo-mode engine (real scoring, fake chain)
│       └── wagmi.ts            # Base + RainbowKit config
├── shared/                     # code shared by frontend, Worker and CLI agent
│   ├── types.ts                # domain types (single source of truth)
│   ├── scoring.ts              # ⭐ the agent brain — deterministic, explainable, $0
│   ├── audius.ts               # Audius client (normalise, resolve, search, trending)
│   └── eip712.ts               # TipAuthorization domain/types + jar-ownership message
├── worker/                     # ⭐ Cloudflare Worker: API + relayer + agent runtime
│   ├── wrangler.toml           # bindings, safety rails, optional cron
│   └── src/
│       ├── index.ts            # router
│       ├── chain.ts            # viem clients, signature verification, transferFrom
│       ├── agent.ts            # mission runner + submitTip
│       ├── store.ts            # KV data layer
│       └── http.ts / env.ts    # helpers + config
├── agent/                      # standalone CLI agent (proves true agentic payments)
│   ├── src/index.ts            # discover → judge → sign → POST /api/agent/tip
│   └── src/smoke.ts            # end-to-end worker smoke test
├── scripts/                    # agent-wallet / agent-activate / agent-status
├── DEPLOY.md                   # ⭐ step-by-step $0 deployment guide (Cloudflare)
├── LOCAL.md                    # runbook: run the whole stack on your machine
├── wrangler.static.toml        # deploy the frontend as a Worker (static assets)
├── preview/                    # zero-install prototype of the UI
│   ├── ui-preview.html         # one file: light/dark theme, wallet modal, tips, agent runner
│   ├── screenshots/            # what it looks like, light + dark
│   └── tests/                  # 65 jsdom checks that click through it
└── public/_redirects           # Cloudflare Pages routing for /@handle and /tip/0x…
```

**Demo mode** is built in: if `NEXT_PUBLIC_API_BASE` is empty the app runs entirely in the browser
(localStorage, real scoring engine over real Audius metadata, simulated chain writes). That means
you can click through the whole product — including a full agent mission — with **zero setup**.
It is clearly labelled "Demo mode" in the header and never pretends a fake tx is real.

---

## Run it locally (5 minutes)

> 📘 **Runbooks:** [`DEPLOY.md`](DEPLOY.md) is the step-by-step $0 deployment guide (local checkpoints →
> KV → secrets → Worker → frontend → first real on-chain tip → verification matrix), and
> [`LOCAL.md`](LOCAL.md) covers running the whole stack on your machine (prototype, demo mode, full
> stack, troubleshooting).

**Prerequisites:** **Node.js 22+** (`wrangler` 4.x refuses to run on Node 20; Next.js 15 needs ≥18.18),
npm, and ~2 GB of free RAM for the first `next build`.

```bash
git clone <your-repo> vibemusic && cd vibemusic
npm install
```

### 1. Instant look — demo mode (no keys, no chain)

```bash
npm run dev          # http://localhost:3000
```

With no `.env`, VibeMusic runs in demo mode: 8 sample jars built from **real Audius tracks**, seeded
tips, a seeded agent mission, and a simulated agent you can trigger from the homepage.
(Want a real "💡" moment? Run a mission from `/agent` — the scoring, matching and reasoning are the
same rules engine the production agent uses.)

### 2. Full stack, local (real chain)

```bash
# terminal 1 — the Worker (relayer + agent + API)
cd worker
npm install
cp .dev.vars.example .dev.vars     # then paste two private keys (see below)
npm run dev                        # http://localhost:8787  (local KV, no account needed)

# terminal 2 — the frontend pointed at the Worker
cd ..
echo "NEXT_PUBLIC_API_BASE=http://localhost:8787" > .env.local
npm run dev                        # http://localhost:3000
```

`worker/.dev.vars` needs:

```ini
AGENT_PRIVATE_KEY=0x…      # the agent wallet  (holds $VIBES only)
RELAYER_PRIVATE_KEY=0x…    # the relayer wallet (holds a little ETH for gas)
```

Generate them:

```bash
npm run agent:wallet            # creates agent/.env with a fresh AGENT_PRIVATE_KEY + prints address
node -e "import('viem/accounts').then(m=>{const k=m.generatePrivateKey();console.log(k, m.privateKeyToAccount(k).address)})"
```

### 3. Prove it works

```bash
npm run agent:status     # wallet, balances, allowance, caps (reads the Worker)
npm --prefix agent run smoke   # 12-check end-to-end test of the whole API contract
npm run agent -- "Tip the best chill tracks right now"   # run the CLI agent
```

The smoke test verifies: health → Audius proxy → signed jar creation → unsigned requests rejected →
EIP-712 signature accepted → **replay blocked** → **tampered authorization rejected** → mission
discovers/judges/signs → relayer reports exactly what is missing (allowance or `$VIBES`).

---

## The agent wallet: fund it, activate it

```bash
npm run agent:wallet      # 1. creates agent/.env, prints the address
```

**2. Fund the agent wallet with `$VIBES` on Base** (no ETH):

* Buy/transfer `$VIBES`
  [`0xefFC8815487084a97edfdfF968b56Ea123421Acb`](https://basescan.org/token/0xefFC8815487084a97edfdfF968b56Ea123421Acb)
  to the printed address. A few hundred `$VIBES` is plenty — the per-tip cap is 100 and the daily cap
  is 500.

**3. Fund the relayer wallet with a *little* ETH** (this wallet pays gas for every agent tip):

* Any amount ≥ ~0.0005 ETH on Base is enough for hundreds of tips (Base fees are fractions of a cent).
  Send it to the `relayerAddress` printed by `npm run agent:status`.

**4. One-time activation** — let the relayer pull tips from the agent wallet:

```bash
npm run agent:activate
```

> **Why is this needed?** `$VIBES` (Vibestarter, `0xefFC…1Acb`) is a plain ERC-20 — it has **no
> EIP-2612 `permit`**, so allowance can only be granted by a transaction. This single `approve` is
> **the only transaction the agent wallet ever sends**. It costs a fraction of a cent of ETH *once*.
> Afterwards the agent leans entirely on the relayer for gas — every tip is gasless for the agent.
>
> If you deploy a `$VIBES`-like token with `permit` support, the Worker already supports that shape:
> extend `submitTip` to accept a permit signature and call `permit()` before `transferFrom()`.

**5. Verify:**

```bash
npm run agent:status
# allowance granted  … — activated: yes
```

Then open <http://localhost:3000/agent> and press **Run mission**. Real `$VIBES` move, the agent's
ETH balance stays at 0, and every tip shows up in the activity feed with its reason and BaseScan link.

---

## Deploy to Cloudflare ($0)

> 📘 The condensed version is below; **[`DEPLOY.md`](DEPLOY.md)** is the same flow step-by-step with
> checkpoints, expected output, a verification matrix and a troubleshooting table.

Everything lives inside one free Cloudflare account.

> `wrangler` 4.x needs **Node ≥ 22** locally. `npm i -g wrangler@latest` if you get a Node error.

### 1. Worker + KV (2 commands)

```bash
cd worker
npx wrangler login

# create the KV namespace and copy the id into wrangler.toml
npx wrangler kv namespace create VIBES_KV
#   → [[kv_namespaces]] binding = "VIBES_KV"  id = "<paste this>"

# secrets (never committed)
npx wrangler secret put AGENT_PRIVATE_KEY
npx wrangler secret put RELAYER_PRIVATE_KEY

npx wrangler deploy
#   → https://vibemusic-relayer.<your-subdomain>.workers.dev
```

Add `ALLOWED_ORIGINS = "https://<your-pages-domain>"` to `[vars]` in `wrangler.toml` (CORS) and
redeploy.

### 2. Frontend → Cloudflare Pages

```bash
cd ..
echo "NEXT_PUBLIC_API_BASE=https://vibemusic-relayer.<your-subdomain>.workers.dev" > .env.production
npm run build            # static export → ./out
npx wrangler pages deploy out --project-name vibemusic
#   → https://vibemusic.pages.dev   🎉
```

Or connect the repo in the dashboard for CI deploys:

| Setting | Value |
|---|---|
| Framework preset | **Next.js (Static HTML Export)** |
| Build command | `npm run build` |
| Build output directory | `out` |
| Env var | `NEXT_PUBLIC_API_BASE = https://vibemusic-relayer.<you>.workers.dev` |
| Optional env var | `NEXT_PUBLIC_WC_PROJECT_ID = <free Reown id>` (only needed for mobile QR wallets) |

The export intentionally contains **no dynamic routes** — `next build` emits plain HTML and Pages
routing does the rest. `public/_redirects` ships with the export and gives you the pretty public URLs:

```
/@handle   → /u/index.html      (client resolves the handle)
/tip/0x…   → /tip/index.html    (client resolves the wallet)
```

### 3. Optional: let the agent cook on its own

Uncomment in `worker/wrangler.toml`, then `npx wrangler deploy`:

```toml
[triggers]
crons = ["0 0,6,12,18 * * *"]
```

The agent will now run a mission four times a day with zero human involvement.

### One-click deploy button

After you push this repo, add your URL here and the button works:

```md
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/<you>/vibemusic)
```

---

## Environment variables

### Frontend (`.env.local` / Pages env)

| Variable | Required | What it does |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | no | Worker URL. **Empty → demo mode** |
| `NEXT_PUBLIC_WC_PROJECT_ID` | no | WalletConnect/Reown id for mobile QR wallets |
| `NEXT_PUBLIC_BASE_RPC_URL` | no | Base RPC for the browser (default `https://mainnet.base.org`) |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URL for OG metadata |

### Worker (`wrangler.toml` vars + secrets)

| Name | Type | Default | Notes |
|---|---|---|---|
| `VIBES_KV` | binding | — | KV namespace (required) |
| `AGENT_PRIVATE_KEY` | **secret** | — | agent wallet key, `$VIBES` only |
| `RELAYER_PRIVATE_KEY` | **secret** | — | relayer key, holds gas ETH |
| `BASE_RPC_URL` | var | `https://mainnet.base.org` | use a private RPC if rate-limited |
| `MAX_TIP_AMOUNT` | var | `100` | max `$VIBES` per agent tip |
| `MIN_SCORE` | var | `68` | agent quality bar (0–100) |
| `MAX_TIPS_PER_MISSION` | var | `2` | keeps CPU + gas per invocation tiny |
| `DAILY_SPEND_CAP` | var | `500` | per UTC day, per agent |
| `ALLOWED_ORIGINS` | var | `*` | comma-separated origins in production |
| `REQUIRE_TIP_JAR` | var | `true` | agent only tips claimed jars |

### CLI agent (`agent/.env`)

| Variable | Default |
|---|---|
| `AGENT_PRIVATE_KEY` | — (required) |
| `WORKER_URL` | `http://localhost:8787` |
| `MIN_SCORE` / `MAX_TIPS` / `MAX_TIP_AMOUNT` | `70` / `2` / `100` |

---

## API reference

Base URL: your Worker. All responses are JSON; all errors are `{ error, code }`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | liveness + limits + agent address |
| `GET` | `/api/stats` | jars, tracks, tips, agent tips, volume |
| `GET` | `/api/jars` | recent jars (with aggregates) |
| `GET` | `/api/jars/:walletOrHandleOrAudiusHandle` | one jar + its tips |
| `POST` | `/api/jars` | create/update a jar — needs an EIP-191 signature |
| `GET` | `/api/tips?limit=` | global tip feed |
| `POST` | `/api/tips` | record a human tip (tx is re-verified on Base) |
| `GET` | `/api/agent/state` | agent/relayer addresses, balances, allowance, today's spend |
| `GET` | `/api/agent/events?limit=` | flattened agent activity feed (every reason) |
| `GET` | `/api/agent/missions?limit=` | mission history with steps |
| `POST` | `/api/agent/run` | `{ prompt }` → run a mission now (synchronous) |
| `POST` | `/api/agent/tip` | `{ authorization, signature }` → verify + relay a signed tip (alias: `/tip-agent`) |
| `GET` | `/api/audius/track?q=` | resolve link / id / search term → normalised track |
| `GET` | `/api/audius/trending?limit=&genre=` | trending tracks passthrough |

**Signed tip payload**

```jsonc
// EIP-712 domain: { name: "VibeMusic", version: "1", chainId: 8453 }
// type TipAuthorization: from, to, amount, nonce, deadline, missionId, reason, trackId
{
  "authorization": {
    "from": "0xAGENT",
    "to": "0xARTIST",
    "amount": "12000000000000000000",   // wei
    "nonce": "1762500000123",
    "deadline": "1762500600",
    "missionId": "m_abc123",
    "reason": "Lo-Fi fits your brief · 13.3k plays with a strong like-rate — 82/100",
    "trackId": "ZlwB7"
  },
  "signature": "0x…",
  "trackTitle": "Instrumental chill"
}
```

Worker responses include `code: "NEEDS_APPROVAL" | "INSUFFICIENT_VIBES" | "REPLAY" | "OVER_CAP" |
"DAILY_CAP" | "BAD_SIGNATURE" | "NO_JAR" | "EXPIRED"` so clients can react precisely.

---

## Data model (KV)

| Key | Value |
|---|---|
| `jar:<wallet>` | `TipJar` (name, bio, x, image, tracks[], audiusHandles[], aggregates) |
| `jar:slug:<slug>` | wallet (vanity handle index) |
| `handle:<audiusHandle>` | wallet (agent discovery index) |
| `jars:recent` | `string[]` newest-first, max 100 |
| `tips:recent` | `Tip[]` max 100 |
| `tips:jar:<wallet>` | `Tip[]` max 50 |
| `missions:recent` | `AgentMission[]` max 12, **includes every step + reason** |
| `nonce:<agent>:<nonce>` | `"1"`, 7-day TTL (replay protection) |
| `spend:<agent>:<utc-day>` | running total, 3-day TTL (daily cap) |

Aggregates (`tipCount`, `totalReceived`) are denormalised onto the jar on every tip so list reads
stay O(1) per jar. No D1 schema, no migrations, no paid database.

---

## The agent brain (scoring rules)

`shared/scoring.ts` — pure, deterministic, dependency-free, **$0** (no LLM needed, no API keys, no
rate limits). A mission prompt is parsed into an intent (genres, moods, freshness/underrated flags),
then each track is scored:

| Signal | Range | Why |
|---|---|---|
| Genre fit vs brief | −10 … +24 | chill/jazz/lo-fi missions shouldn't tip dubstep |
| Mood fit vs brief | 0 … +14 | "Peaceful", "Cool", "Fiery" … |
| Plays (log-scaled) | 0 … +14 | popularity without whale bias |
| Like-rate | 0 … +6 | quality proxy: likes ÷ plays |
| Freshness | 0 … +10 | "fresh drops" missions weight this higher |
| Hidden-gem bonus | 0 … +10 | underrated missions reward < 5k plays + real likes |
| Craft / metadata | 0 … +8 | artwork, description, sane runtime, tags |
| Penalties | −14 … 0 | 20-min mixes, <45s clips, missing handles, recently tipped |
| Variety nudge | ±3 | deterministic per mission so runs differ but replay |

Score → tip size: `≥88 → 25`, `≥80 → 18`, `≥72 → 12`, else `8` `$VIBES` (capped by the Worker).
Each tip's reason is generated from the **strongest three positive signals**, e.g.

> *Lo-Fi fits your brief · 13.3k plays · strong like-rate (1.9%) — 82/100*

Selection also prefers artists who actually claimed a jar (a tip should land in a real wallet) and
tips at most one track per artist per mission.

**Optional LLM:** the evaluator interface is a single function (`scoreTrack`). If you want an LLM
judge, add a free-tier model call in `runMission` with the rules score as a fallback and set
`mission.evaluator = 'rules+llm'`. The UI already renders that field.

---

## Demo script for judges

1. **Home** — hero, live stats, then press a mission preset in *Let the agent cook*. Watch the phase
   rail (discover → judge → match → sign → relay) and the receipts with reasons.
2. **`/agent`** — the wallet cards: agent `$VIBES` balance, **0 ETH**, relayer gas tank, allowance
   state, daily caps. Expand a mission to see every step; the activity log shows the same events.
3. **Create a jar** — paste an Audius link (or hit a quick pick), sign, publish. You get `/@handle`.
4. **Open the public jar** — play a preview, tip 10 `$VIBES` with a message, watch the feed update;
   the agent's own tip (if it already found you) shows its reasoning.
5. **Run the CLI agent** to show it is not UI magic:
   ```bash
   npm run agent -- "Reward underrated lo-fi artists with under 5k plays"
   ```
   …then `npm --prefix agent run smoke` for the crypto contract (replay + tamper protection).

**No funds handy?** Everything above works in demo mode too — the header badge says *Demo mode* and
no fake transaction is ever presented as on-chain.

---

## Cost & free-tier maths

| Service | Free tier | VibeMusic usage |
|---|---|---|
| Cloudflare Pages | unlimited static requests | static export, no SSR |
| Cloudflare Workers | 100k req/day, 10 ms CPU/invocation | missions capped at 2 tips to stay far under CPU |
| Cloudflare KV | 100k reads/day, 1k writes/day | ~10 reads + ~4 writes per mission |
| Audius API | free, keyless | 2–4 reads per mission, 1 per track link |
| Base gas | — | paid by the **relayer** (~$0.0002/tip), not by the agent |
| LLM | not used | rules engine only |

Total: **$0/month**, and the only real spend is the dust of ETH you park in the relayer.

---

## Security & production hardening

What is already enforced: EIP-712 domain-separated authorizations, replay protection, expiry,
per-tip and daily caps, recipient-must-have-a-jar, on-chain verification of human tips, CORS
allowlist, input validation and size limits, secrets via `wrangler secret`.

Before running this with real volume you would add:

* **Rate limiting** per IP (Workers has no free rate-limiter — use a KV counter or Cloudflare WAF rules).
* **A relayer nonce lock in Durable Objects** (the current mutex is per-isolate, which is fine for the
  low mission concurrency here but not for parallel bursts).
* **Origin allowlist** (`ALLOWED_ORIGINS`) — set it to your Pages domain.
* **Move mission execution off the request path** (Queues + `ctx.waitUntil`) for longer missions.
* **Key custody**: the agent key lives in a Worker secret so the demo is self-driving. For higher
  stakes, run the agent where the key is isolated (the standalone `agent/` CLI already does this) and
  keep only the relayer key in the Worker.
* **Observation limits**: KV eventual consistency means a tip may take a few seconds to appear in
  another region. D1 would remove that if you ever need strict read-after-write.

### Design note: "the agent holds only $VIBES"

Gas is 100% sponsored: the relayer pays for every `transferFrom`. The single exception in the whole
system is the **one-time `approve`** used to grant allowance, because this token has no `permit`.
Run `npm run agent:activate` once, and the agent wallet's ETH balance can stay at **exactly zero**
forever.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Header shows **Demo mode** | `NEXT_PUBLIC_API_BASE` is empty — set it and rebuild |
| Agent says `NEEDS_APPROVAL` | `npm run agent:activate` (once) |
| `INSUFFICIENT_VIBES` | fund the agent wallet with `$VIBES` on Base |
| Tips fail with `TX_REVERTED` / RPC errors | swap `BASE_RPC_URL` for a private Base RPC |
| `agent:activate` says "needs a dust of ETH" | send ~0.00002 ETH to the agent address **once** |
| Jar creation returns 401 | the wallet signature expired (15 min) — sign again |
| Nothing gets tipped in a mission | check `MIN_SCORE`; the log shows the top scores and why each was skipped |
| `/@handle` 404s in production | make sure `public/_redirects` shipped to Pages (it is in `out/`) |
| `wrangler` complains about Node | use Node ≥ 22 for wrangler |
| Audit shows "no matching transfer" | the tip tx must call `transfer` on `$VIBES` to that exact jar wallet |
| `next build` dies with heap/OOM on a 2 GB VM | `NODE_OPTIONS=--max-old-space-size=4096 npm run build` (Cloudflare Pages and laptops don't need this) |
| `/tip/0x…` works locally but 404s in prod | `public/_redirects` must ship inside `out/` — do not rename it |

---

Built with Next.js 15, wagmi v2, viem, RainbowKit, Cloudflare Workers/KV and the Audius public API.
MIT licensed — go tip someone.
