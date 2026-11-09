'use client';

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ExternalLink,
  Fuel,
  KeyRound,
  Repeat,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

const VIBES = '0xefFC8815487084a97edfdfF968b56Ea123421Acb';
const AGENT = '0x51DBA03b61827DF95AA144E4872DF0498DFb4363';
const RELAYER = '0x14EE7f027B3951df1fCA888832CA1DaD0F6be9cB';
const API = 'https://vibemusic-relayer.vibetipmusic.workers.dev';
const TX = '0xfbccbe35d54baba2292fa4d08410e82044c2226efbe2f469315ce4c8f977764c';

const TOC = [
  ['what', 'Overview'],
  ['artists', 'For artists'],
  ['fans', 'For fans'],
  ['agent', 'The agent'],
  ['scoring', 'Scoring rubric'],
  ['safety', 'Safety rails'],
  ['gasless', 'Gasless tips'],
  ['api', 'API reference'],
  ['faq', 'FAQ'],
];

/* ── small building blocks ─────────────────────────────────────────────── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.08] bg-ink-900 p-5 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.55)] ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex flex-col justify-between">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-2 font-mono text-[13px] leading-snug text-white/85">{value}</p>
      {hint ? <p className="mt-1 text-[11.5px] text-white/40">{hint}</p> : null}
    </Card>
  );
}

function SectionBlock({
  id,
  eyebrow,
  title,
  lede,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-vibe-300/60" />
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-vibe-300">{eyebrow}</p>
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{title}</h2>
      {lede ? <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-white/50">{lede}</p> : null}
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}

function Bar({ points, max, negative }: { points: number; max: number; negative?: boolean }) {
  const pct = Math.min(100, (Math.abs(points) / max) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={negative ? 'h-full rounded-full bg-rose-400/70' : 'h-full rounded-full bg-vibe-400'}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-white/[0.07] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] text-vibe-200">
      {children}
    </code>
  );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* hero */}
      <header className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-vibe-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-aura-500/15 blur-3xl" />
        <div className="relative">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/40">Documentation</p>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-[52px]">
            How VibeMusic works<span className="text-gradient-vibe">.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-white/55 sm:text-base">
            A tip jar for Audius artists, paid in <span className="text-white/85">$VIBES</span> on Base — by humans in
            one click, and by an autonomous agent that explains every payment it makes.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:opacity-90"
            >
              <Wallet className="h-4 w-4" /> Create a jar
            </Link>
            <Link
              href="/agent"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-semibold text-white/85 transition hover:bg-white/[0.06]"
            >
              <Bot className="h-4 w-4" /> Agent console
            </Link>
            <a
              href={`${API}/api/health`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-[13px] font-medium text-white/55 transition hover:text-white/85"
            >
              API health <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Network" value="Base · 8453" hint="mainnet, not a testnet" />
            <Stat label="Agent wallet" value={`${AGENT.slice(0, 8)}…${AGENT.slice(-6)}`} hint="holds $VIBES, never ETH" />
            <Stat label="Gas" value="sponsored" hint="relayer pays ~$0.001/tip" />
            <Stat label="Infra bill" value="$0 / month" hint="Pages + Workers + KV free tier" />
          </div>
        </div>
      </header>

      {/* body: sticky TOC + content */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[190px_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 border-l border-white/[0.08] pl-4">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/30">On this page</p>
            {TOC.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="block rounded-md py-1 text-[13px] text-white/45 transition hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-14">
          {/* mobile TOC */}
          <div className="-mt-2 flex flex-wrap gap-2 lg:hidden">
            {TOC.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/55"
              >
                {label}
              </a>
            ))}
          </div>

          <SectionBlock
            id="what"
            eyebrow="Overview"
            title="A jar is just a wallet"
            lede="No custodial balance, no platform holding the money. The jar is an address; tips are ERC-20 transfers that land in the artist's own wallet."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [<Wallet key="1" className="h-4 w-4" />, 'Humans tip', 'One signature. The Worker relays it and pays the gas.'],
                [<Bot key="2" className="h-4 w-4" />, 'An agent tips', 'It discovers, scores and pays — and says why, in English.'],
                [<ShieldCheck key="3" className="h-4 w-4" />, 'Artists own it', 'Funds never pass through VibeMusic at any point.'],
              ].map(([icon, t, d]) => (
                <Card key={t as string}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-vibe-300">
                    {icon as React.ReactNode}
                  </span>
                  <p className="mt-3 text-[13.5px] font-semibold text-white">{t as string}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-white/45">{d as string}</p>
                </Card>
              ))}
            </div>
            <Card>
              <p className="text-[13.5px] leading-relaxed text-white/60">
                The site is a static Next.js export on Cloudflare Pages. One Worker handles metadata, signature
                verification and relaying; one KV namespace stores jars, tips, missions, nonces and daily spend
                counters. There is no database and no paid service anywhere in the stack.
              </p>
            </Card>
          </SectionBlock>

          <SectionBlock
            id="artists"
            eyebrow="For artists"
            title="Claim a jar in four steps"
            lede="All of it is off-chain until someone sends money, so setup costs nothing."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Connect a wallet', 'MetaMask, Rabby, Coinbase Wallet — anything injected. The address is the jar.'],
                ['Link 1–3 tracks', 'Paste an Audius link or search by name; metadata and artwork come from the free API.'],
                ['Sign the claim', 'An off-chain signature proves the wallet is yours. No gas, no transaction.'],
                ['Share the page', 'Your jar lives at /@your-handle and can be tipped by anyone, including the agent.'],
              ].map(([t, d], i) => (
                <Card key={t}>
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-vibe-300/30 bg-vibe-300/10 text-[11.5px] font-bold text-vibe-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-white">{t}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-white/45">{d}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="border-vibe-300/20 bg-vibe-300/[0.05]">
              <p className="text-[13px] leading-relaxed text-white/65">
                <strong className="text-white">Why claim at all?</strong> The agent only pays wallets that claimed a
                jar (<Code>REQUIRE_TIP_JAR=true</Code>). Sending tokens to a random Audius account burns them; a claimed
                jar proves someone can actually receive.
              </p>
            </Card>
          </SectionBlock>

          <SectionBlock
            id="fans"
            eyebrow="For fans"
            title="Tipping takes one signature"
            lede="Pick an amount, sign, done. Every tip is public: amount, sender, receiver, reason and transaction hash."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <p className="text-[13.5px] font-semibold text-white">From a jar page</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/45">
                  The transfer is relayed, so you never need to hold ETH for gas — only the $VIBES you are sending.
                </p>
              </Card>
              <Card>
                <p className="text-[13.5px] font-semibold text-white">From your own wallet</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/45">
                  The classic path: you sign and send the ERC-20 transfer yourself, straight to the artist.
                </p>
              </Card>
            </div>
          </SectionBlock>

          <SectionBlock
            id="agent"
            eyebrow="The agent"
            title="A mission is a brief, then five steps"
            lede="“Reward underrated lo-fi artists with under 5k plays” becomes an intent, and the intent drives every stage."
          >
            <div className="flex flex-wrap items-center gap-2">
              {[
                [<Bot key="a" className="h-3.5 w-3.5" />, 'discover'],
                [<Check key="b" className="h-3.5 w-3.5" />, 'judge'],
                [<Wallet key="c" className="h-3.5 w-3.5" />, 'match'],
                [<KeyRound key="d" className="h-3.5 w-3.5" />, 'sign'],
                [<Fuel key="e" className="h-3.5 w-3.5" />, 'relay'],
              ].map(([icon, label], i, arr) => (
                <React.Fragment key={label as string}>
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12.5px] font-medium text-white/80">
                    {icon as React.ReactNode}
                    {label as string}
                  </span>
                  {i < arr.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-white/25" /> : null}
                </React.Fragment>
              ))}
            </div>
            <div className="space-y-2.5">
              {[
                ['Discover', 'Pulls trending and search results from the Audius API, filtered by the intent’s genres and moods.'],
                ['Judge', 'Scores every candidate 0–100 with a visible breakdown; anything under MIN_SCORE is dropped.'],
                ['Match', 'Keeps only tracks whose artist claimed a VibeMusic jar — the wallet it is allowed to pay.'],
                ['Sign', 'Signs an EIP-712 TipAuthorization: from, to, amount, nonce, deadline, missionId, reason, trackId.'],
                ['Relay', 'The Worker verifies signature and nonce, enforces the caps, sends transferFrom, pays the gas.'],
              ].map(([t, d], i) => (
                <Card key={t}>
                  <div className="flex gap-3.5">
                    <span className="mt-0.5 font-mono text-[12px] text-white/25">0{i + 1}</span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-white">{t}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-white/45">{d}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </SectionBlock>

          <SectionBlock
            id="scoring"
            eyebrow="Transparency"
            title="The rubric, in full"
            lede="No model, no vibes. A fixed rubric over the track's own metadata — same mission, same catalogue, same scores."
          >
            <Card className="divide-y divide-white/[0.06] p-0">
              {[
                ['Genre fit', '+24 on-brief · −10 off-brief · +6 untagged', 24],
                ['Mood fit', '+14 match · +5 unconstrained', 14],
                ['Engagement', 'up to +14 from plays (log scale), +6 for like-rate', 14],
                ['Freshness', '+10 fresh · +6 recent · +2 this quarter', 10],
                ['Hidden gem', '+10 under 5k plays with real likes', 10],
                ['Craft', '+8 artwork, description, runtime, tags', 8],
                ['Variety', '±3 deterministic jitter per mission', 3],
              ].map(([k, d, pts]) => (
                <div key={k as string} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] font-semibold text-white">{k as string}</p>
                      <p className="font-mono text-[12px] text-vibe-300">+{pts as number}</p>
                    </div>
                    <p className="mt-0.5 text-[12px] text-white/40">{d as string}</p>
                    <div className="mt-2">
                      <Bar points={pts as number} max={24} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3.5">
                <p className="text-[12.5px] text-white/45">
                  Penalties subtract instead: <Code>−8</Code> over 20 minutes, <Code>−6</Code> under 45 seconds,{' '}
                  <Code>−4</Code> no artist handle, <Code>−14</Code> tipped too recently.
                </p>
              </div>
            </Card>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ['Score ≥ 88', '25 $VIBES'],
                ['Score ≥ 80', '18 $VIBES'],
                ['Score ≥ 72', '12 $VIBES'],
                ['otherwise', '8 $VIBES'],
              ].map(([a, b]) => (
                <Card key={a} className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">{a}</p>
                  <p className="mt-1.5 font-mono text-[15px] text-white/85">{b}</p>
                </Card>
              ))}
            </div>
          </SectionBlock>

          <SectionBlock
            id="safety"
            eyebrow="Safety"
            title="Guardrails that make a rogue agent harmless"
            lede="The limits are enforced by the ERC-20 allowance and the Worker — not by the prompt."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Allowance', 'One on-chain approve is the hard ceiling. No approval, no payment.'],
                ['MAX_TIP_AMOUNT', '100 $VIBES per single tip.'],
                ['MAX_TIPS_PER_MISSION', 'Two payments per mission run.'],
                ['DAILY_SPEND_CAP', '500 $VIBES per UTC day, counted in KV.'],
                ['MIN_SCORE', '68 — below that, no payment at any size.'],
                ['Nonce', 'The same authorization cannot settle twice.'],
                ['EIP-712 signature', 'Change one wei of the amount and it stops verifying.'],
                ['REQUIRE_TIP_JAR', 'No claimed jar, no tip — and the log says why.'],
              ].map(([k, d]) => (
                <Card key={k} className="p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-vibe-300" />
                    <p className="font-mono text-[12px] text-white/80">{k}</p>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/45">{d}</p>
                </Card>
              ))}
            </div>
          </SectionBlock>

          <SectionBlock
            id="gasless"
            eyebrow="Gasless"
            title="The agent holds $VIBES, never ETH"
            lede="$VIBES is a plain ERC-20 with no permit, so one approve at setup is the only transaction the agent ever sends."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Agent wallet', AGENT, 'holds $VIBES only — about zero ETH, forever'],
                ['Relayer', RELAYER, 'small ETH float, pays ~$0.001 of gas per tip'],
                ['Token', VIBES, 'always verify before sending anything'],
                ['Proof transaction', `${TX.slice(0, 10)}…${TX.slice(-8)}`, 'a settled agent tip on Base mainnet'],
              ].map(([label, addr, hint], i) => (
                <Card key={label}>
                  <p className="text-[10.5px] uppercase tracking-[0.16em] text-white/30">{label}</p>
                  <p className="mt-1.5 break-all font-mono text-[11.5px] text-white/80">{addr}</p>
                  <p className="mt-2 text-[11.5px] text-white/40">{hint}</p>
                  <a
                    href={
                      i === 3
                        ? `https://basescan.org/tx/${TX}`
                        : `https://basescan.org/${i === 2 ? 'token' : 'address'}/${addr.startsWith('0x') && addr.length === 42 ? addr : VIBES}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-vibe-300 hover:text-vibe-200"
                  >
                    View on Basescan <ArrowUpRight className="h-3 w-3" />
                  </a>
                </Card>
              ))}
            </div>
            <Card>
              <p className="text-[13px] leading-relaxed text-white/55">
                Steal the agent&apos;s key and you still cannot drain it: the relayer refuses any authorization above the
                caps, with a spent nonce, or after the daily limit. The worst case is bounded by the allowance the artist
                — not the agent — is exposed to.
              </p>
            </Card>
          </SectionBlock>

          <SectionBlock
            id="api"
            eyebrow="For builders"
            title="The whole API is eight endpoints"
            lede="One Worker, JSON in and out, no auth for reads. Writes require a wallet signature."
          >
            <Card className="divide-y divide-white/[0.06] p-0">
              {[
                ['GET', '/api/health', 'network, token, agent address, live limits'],
                ['GET', '/api/stats', 'jars, tracks, tips, agent tips'],
                ['GET', '/api/jars', 'recent jars'],
                ['GET', '/api/jars/:handle', 'one jar by handle or wallet'],
                ['POST', '/api/jars', 'claim a jar (requires a wallet signature)'],
                ['GET', '/api/agent/state', 'balances, allowance, spend today'],
                ['POST', '/api/agent/run', 'run a mission: { prompt }'],
                ['POST', '/api/agent/tip', 'relay an externally signed TipAuthorization'],
              ].map(([method, path, desc]) => (
                <div key={path} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span
                    className={`w-14 flex-none rounded-md px-1.5 py-0.5 text-center font-mono text-[10.5px] font-bold ${
                      method === 'GET'
                        ? 'bg-sky-400/10 text-sky-300'
                        : 'bg-vibe-300/10 text-vibe-300'
                    }`}
                  >
                    {method}
                  </span>
                  <code className="font-mono text-[12.5px] text-white/80">{path}</code>
                  <span className="text-[12px] text-white/40 sm:ml-auto">{desc}</span>
                </div>
              ))}
            </Card>
            <Card className="flex flex-wrap items-center gap-3">
              <Sparkles className="h-4 w-4 text-vibe-300" />
              <p className="text-[12.5px] text-white/55">
                Try it now:{' '}
                <a
                  href={`${API}/api/health`}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline font-mono text-[12px] text-white/80"
                >
                  {API}/api/health
                </a>
              </p>
            </Card>
          </SectionBlock>

          <SectionBlock id="faq" eyebrow="FAQ" title="The questions people actually ask">
            <div className="space-y-2.5">
              {[
                [
                  'Does the agent need ETH?',
                  'No. It holds $VIBES only. One approve at setup is the only transaction it ever sends; every tip after that is signed off-chain and relayed by the Worker, which pays the gas.',
                ],
                [
                  'What if nobody claimed a jar?',
                  'The agent still runs, scores and logs — it just pays nobody, and says why for each track. That is REQUIRE_TIP_JAR doing its job, not a failure.',
                ],
                [
                  'Is the score random?',
                  'No. It is a fixed rubric over the track metadata with a ±3 deterministic variety nudge so repeat missions are not identical. The breakdown is shown for every candidate.',
                ],
                [
                  'Where is the data stored?',
                  'One Cloudflare KV namespace: jars, tips, missions, nonces and daily spend counters. No database, no paid services.',
                ],
                [
                  'What does it cost to run?',
                  'Pages, Workers and KV all sit inside free tiers. The only real cost is the relayer’s ETH float — roughly $0.001 per tip on Base.',
                ],
                [
                  'Can I run it locally?',
                  'Yes — the repo ships a local runbook, an interactive prototype and a 12-check smoke suite that exercises the whole contract against a local Worker.',
                ],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-2xl border border-white/[0.08] bg-ink-900 px-5 py-4">
                  <summary className="cursor-pointer list-none text-[13.5px] font-semibold text-white marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {q}
                      <span className="text-white/25 transition group-open:rotate-90">›</span>
                    </span>
                  </summary>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/50">{a}</p>
                </details>
              ))}
            </div>
          </SectionBlock>

          {/* CTA */}
          <div className="relative overflow-hidden rounded-3xl border border-vibe-300/25 bg-vibe-300/[0.07] px-6 py-8 sm:px-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-vibe-400/20 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[17px] font-semibold text-white">Put your music where the money is.</p>
                <p className="mt-1.5 text-[13px] text-white/55">
                  Claim a jar in under a minute, or watch the agent explain its next mission.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:opacity-90"
                >
                  Create a jar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/agent"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-semibold text-white/85 transition hover:bg-white/[0.06]"
                >
                  <Bot className="h-3.5 w-3.5" /> Agent console
                </Link>
              </div>
            </div>
          </div>

          <p className="flex items-center gap-1.5 pb-2 text-[11.5px] text-white/25">
            <Repeat className="h-3 w-3" /> Token {VIBES.slice(0, 10)}… on Base (8453) — always verify the contract
            address before sending anything.
          </p>
        </div>
      </div>
    </div>
  );
}
