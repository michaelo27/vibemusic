'use client';

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Fuel,
  PenLine,
  Radar,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { AgentActivity } from '@/components/agent-activity';
import { AgentCook } from '@/components/agent-cook';
import { Artwork } from '@/components/artwork';
import { JarCard, JarCardSkeleton } from '@/components/jar-card';
import { JarLink } from '@/components/links';
import { StatStrip } from '@/components/stat-strip';
import { TipsFeed } from '@/components/tips-feed';
import { VibePassCard } from '@/components/vibe-pass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, SectionHeading } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { AgentEvent, Stats, Tip, TipJar } from '@/lib/types';

export default function HomePage() {
  const [jars, setJars] = React.useState<TipJar[] | null>(null);
  const [tips, setTips] = React.useState<Tip[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [events, setEvents] = React.useState<AgentEvent[]>([]);

  const load = React.useCallback(async () => {
    const [j, t, s, e] = await Promise.all([
      api.listJars().catch(() => []),
      api.recentTips(10).catch(() => []),
      api.stats().catch(() => null),
      api.agentEvents(12).catch(() => []),
    ]);
    setJars(j);
    setTips(t);
    setStats(s);
    setEvents(e);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const nameFor = React.useCallback(
    (wallet: string) => {
      const j = jars?.find((x) => x.wallet.toLowerCase() === wallet.toLowerCase());
      return j ? `@${j.slug}` : undefined;
    },
    [jars],
  );

  const leaderboard = React.useMemo(() => {
    if (!jars) return [];
    return [...jars]
      .filter((j) => Number(j.totalReceived ?? 0) > 0)
      .sort((a, b) => Number(b.totalReceived ?? 0) - Number(a.totalReceived ?? 0))
      .slice(0, 5);
  }, [jars]);

  const maxReceived = Math.max(1, ...leaderboard.map((j) => Number(j.totalReceived ?? 0)));

  /** card in the hero: the jar with the most tracks, else the newest one */
  const featured = React.useMemo(() => {
    if (!jars || jars.length === 0) return null;
    return [...jars].sort((a, b) => (b.tracks?.length ?? 0) - (a.tracks?.length ?? 0))[0] ?? null;
  }, [jars]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* ───────────────────────── hero ───────────────────────── */}
      <section className="relative pb-4 pt-12 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Badge tone="vibe" className="px-2.5 py-1">
              <Sparkles className="h-3 w-3" /> Vibeathon 02
            </Badge>
            <Badge tone="neutral" className="px-2.5 py-1">
              Base mainnet
            </Badge>
            <Badge tone="aura" className="px-2.5 py-1">
              <Fuel className="h-3 w-3" /> gasless agent
            </Badge>
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Get tipped by humans.
            <br />
            <span className="text-gradient-vibe">And by an agent with taste.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-white/50 sm:text-base">
            VibeMusic gives Audius artists a <span className="text-white/80">$VIBES</span> tip jar on Base. Fans tip in
            one click. Our autonomous agent discovers tracks, judges them against a mission, and pays the artists —
            signing off-chain while a Cloudflare Worker sponsors every unit of gas.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link href="/create">
              <Button variant="accent" size="lg" className="w-full gap-2 sm:w-auto">
                <Wallet className="h-4 w-4" /> Create your tip jar
              </Button>
            </Link>
            <a href="#agent">
              <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto">
                <Bot className="h-4 w-4" /> Watch the agent cook
              </Button>
            </a>
          </div>

          <div className="mt-10">
            <VibePassCard jar={featured} />
          </div>

          <div className="mt-9">
            <StatStrip stats={stats} loading={!stats} />
          </div>
        </div>
      </section>

      {/* ───────────────────────── agent ───────────────────────── */}
      <section id="agent" className="scroll-mt-24 pt-12 sm:pt-16">
        <AgentCook onDone={() => void load()} />
      </section>

      {/* ───────────────────────── discover ───────────────────────── */}
      <section id="discover" className="scroll-mt-24 pt-14 sm:pt-20">
        <SectionHeading
          eyebrow="discover"
          title="Recent tip jars"
          description="Independent artists on Audius, one click away from a tip. Every jar is a wallet — no platform in the middle."
          action={
            <Link href="/create">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Add yours
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!jars && Array.from({ length: 6 }).map((_, i) => <JarCardSkeleton key={i} />)}
          {jars?.slice(0, 6).map((jar, i) => <JarCard key={jar.wallet} jar={jar} index={i} />)}
        </div>

        {jars && jars.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/[0.08] px-6 py-16 text-center">
            <Users className="mx-auto h-6 w-6 text-white/20" />
            <p className="mt-3 text-[14px] font-medium text-white/70">No tip jars yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-white/35">
              Be the first artist on VibeMusic — link a track and the agent can start tipping you.
            </p>
            <Link href="/create" className="mt-4 inline-block">
              <Button variant="accent" size="md">
                Create your jar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ───────────────────────── leaderboard + tips ───────────────────────── */}
      <section className="grid gap-4 pt-14 sm:pt-20 lg:grid-cols-[1fr_1.05fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <TrendingUp className="h-3.5 w-3.5 text-vibe-300" /> trending tipped artists
              </h3>
              <span className="text-[10.5px] uppercase tracking-wider text-white/20">24h</span>
            </div>

            <ol className="space-y-2.5">
              {leaderboard.map((jar, i) => {
                const pct = Math.round((Number(jar.totalReceived ?? 0) / maxReceived) * 100);
                return (
                  <li key={jar.wallet}>
                    <JarLink wallet={jar.wallet} slug={jar.slug} className="group block">
                      <div className="flex items-center gap-3">
                        <span className="num w-3 text-[11px] font-semibold text-white/25">{i + 1}</span>
                        <Artwork
                          src={jar.image || jar.tracks?.[0]?.artwork}
                          seed={jar.wallet}
                          name={jar.name}
                          className="h-9 w-9"
                          rounded="rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-white/85 group-hover:text-white">
                            {jar.name}
                          </p>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-vibe-400 to-aura-400 transition-all duration-700"
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                        </div>
                        <span className="num shrink-0 text-[12px] font-semibold text-vibe-200/90">
                          {Number(jar.totalReceived ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </JarLink>
                  </li>
                );
              })}
              {leaderboard.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/[0.07] px-3 py-8 text-center text-[12px] text-white/30">
                  Waiting for the first tip…
                </li>
              )}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <Zap className="h-3.5 w-3.5 text-vibe-300" /> live tip feed
              </h3>
              <span className="flex items-center gap-1.5 text-[10.5px] text-white/25">
                <span className="h-1 w-1 animate-pulse rounded-full bg-vibe-300" /> live
              </span>
            </div>
            <TipsFeed tips={tips} nameFor={nameFor} compact empty="No tips yet. Humans first, then the agent." />
          </CardContent>
        </Card>
      </section>

      {/* ───────────────────────── agent activity ───────────────────────── */}
      <section className="pt-14 sm:pt-20">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="agent activity"
              title="Every tip has a reason"
              description="The agent runs on deterministic, explainable rules — genre fit, mood match, engagement, craft and freshness — so you can always audit why your track got paid."
            />
            <div className="grid gap-2">
              <HowStep
                icon={Radar}
                title="It discovers"
                body="Pulls trending and search results straight from the free Audius API."
              />
              <HowStep
                icon={Sparkles}
                title="It judges"
                body="Scores every track 0–100 with a transparent breakdown, then picks the best few."
              />
              <HowStep
                icon={PenLine}
                title="It signs, never pays gas"
                body="The agent holds only $VIBES. It signs an EIP-712 authorization and the Worker relays the transfer."
              />
            </div>
            <Link href="/agent" className="mt-4 inline-flex">
              <Button variant="secondary" size="md" className="gap-1.5">
                Open agent console <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">agent log</h3>
                <Badge tone="vibe">auditable</Badge>
              </div>
              <AgentActivity events={events} limit={9} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ───────────────────────── how it works ───────────────────────── */}
      <section className="pt-14 sm:pt-20">
        <SectionHeading
          eyebrow="under the hood"
          title="Built for $0 infrastructure"
          description="Static Next.js on Cloudflare Pages, one Worker for the relayer + agent, KV for storage, Audius for metadata. No paid services anywhere."
          className="max-w-2xl"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Audius API', d: 'Free, keyless metadata, artwork and streamable previews.', i: Radar },
            { t: 'Base mainnet', d: '$VIBES ERC-20 transfers, ~$0.001 gas settled by the relayer.', i: Zap },
            { t: 'EIP-712 auth', d: 'The agent signs intents; a Worker verifies and broadcasts.', i: PenLine },
            { t: 'Cloudflare', d: 'Pages + Workers + KV, all inside free-tier limits.', i: Fuel },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12]"
            >
              <x.i className="h-4 w-4 text-vibe-300/80" />
              <p className="mt-3 text-[13px] font-semibold text-white/85">{x.t}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white/35">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="pt-16 sm:pt-24">
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-gradient-to-br from-vibe-400/[0.09] via-white/[0.02] to-aura-500/[0.09] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-vibe-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-aura-500/20 blur-3xl" />
          <h2 className="relative text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Put your music where the money is.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/50">
            Link three tracks in under a minute. Fans tip, the agent tips, and every transaction is verifiable on Base.
          </p>
          <div className="relative mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link href="/create">
              <Button variant="accent" size="lg" className="gap-2">
                Create your tip jar <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#agent">
              <Button variant="outline" size="lg" className="gap-2">
                Run a mission
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function HowStep({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Radar;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
        <Icon className="h-3.5 w-3.5 text-vibe-300/80" />
      </span>
      <div>
        <p className="text-[12.5px] font-semibold text-white/85">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/40">{body}</p>
      </div>
    </div>
  );
}
