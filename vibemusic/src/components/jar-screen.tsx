'use client';

import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  Check,
  Copy,
  ExternalLink,
  Fuel,
  Link2,
  Music2,
  Share2,
  Sparkles,
  Wallet,
} from 'lucide-react';
import * as React from 'react';
import { AgentActivity } from '@/components/agent-activity';
import { Artwork } from '@/components/artwork';
import { TipPanel } from '@/components/tip-panel';
import { TipsFeed } from '@/components/tips-feed';
import { TrackRow } from '@/components/track-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { Tip, TipJar } from '@/lib/types';
import { cn, shortAddress } from '@/lib/utils';
import { addressUrl } from '@/lib/vibes';

/**
 * Resolve the jar identity from the URL. Works for every public form:
 *   /@luna        /tip/0xabc…      /0xabc…      /tip?w=0xabc…    /u?h=luna
 * (Cloudflare Pages rewrites these to /u/index.html and /tip/index.html.)
 */
function useRouteId(explicit?: string) {
  const [id, setId] = React.useState<string | null>(explicit ?? null);
  const [ready, setReady] = React.useState(!!explicit);

  React.useEffect(() => {
    if (explicit) return;
    const path = window.location.pathname;
    const q = new URLSearchParams(window.location.search);
    const fromQuery = q.get('w') || q.get('h');
    const m =
      path.match(/^\/@([^/]+)/) ||
      path.match(/^\/u\/([^/]+)/) ||
      path.match(/^\/tip\/([^/]+)/) ||
      path.match(/^\/(0x[a-fA-F0-9]{40})/);
    setId(decodeURIComponent(fromQuery || (m ? m[1] : '')) || null);
    setReady(true);
  }, [explicit]);

  return { id, ready };
}

export function JarScreen({ id: explicitId }: { id?: string }) {
  const { id, ready } = useRouteId(explicitId);
  const [data, setData] = React.useState<{ jar: TipJar; tips: Tip[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!ready) return;
    if (!id) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .getJar(id)
      .then((res) => {
        if (alive) setData(res);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, ready]);

  if (!ready || loading) return <JarSkeleton />;

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Music2 className="h-5 w-5 text-white/30" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-white">No tip jar here</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-white/40">
          Nobody has claimed <span className="num text-white/60">{id ?? 'this link'}</span> yet. If this is your
          handle, create a jar and link your Audius tracks in under a minute.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <a href="/create">
            <Button variant="accent">Create a tip jar</Button>
          </a>
          <a href="/">
            <Button variant="outline">Discover jars</Button>
          </a>
        </div>
      </div>
    );
  }

  const { jar, tips: jarTips } = data;
  const agentTips = jarTips.filter((t) => t.isAgent);
  const received = Number(jar.totalReceived ?? 0);

  const share = () => {
    const url = `${window.location.origin}/@${jar.slug}`;
    if (navigator.share) {
      void navigator.share({ title: `Tip ${jar.name} on VibeMusic`, url }).catch(() => {});
      return;
    }
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <a
        href="/#discover"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-white/35 transition hover:text-white/70"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> all jars
      </a>

      {/* ── header ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="relative h-28 sm:h-36">
          <div className="absolute inset-0 bg-gradient-to-r from-vibe-500/20 via-ink-900 to-aura-500/20" />
          <div className="absolute inset-0 grid-bg opacity-40" />
          {jar.tracks[0]?.artwork && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={jar.tracks[0].artwork}
                alt=""
                className="h-full w-full scale-110 object-cover opacity-25 blur-2xl"
              />
            </>
          )}
        </div>

        <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <Artwork
              src={jar.image || jar.tracks[0]?.artwork}
              seed={jar.wallet}
              name={jar.name}
              rounded="rounded-2xl"
              className="h-20 w-20 border-2 border-ink-950/80 shadow-xl sm:h-24 sm:w-24"
            />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">{jar.name}</h1>
                <Badge tone="vibe">
                  <BadgeCheck className="h-3 w-3" /> jar live
                </Badge>
                {agentTips.length > 0 && (
                  <Badge tone="aura">
                    <Bot className="h-3 w-3" /> tipped by agent
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/40">
                <span className="text-white/55">@{jar.slug}</span>
                <a
                  href={addressUrl(jar.wallet)}
                  target="_blank"
                  rel="noreferrer"
                  className="num inline-flex items-center gap-1 hover:text-white/70"
                >
                  <Wallet className="h-3 w-3" /> {shortAddress(jar.wallet, 6)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
                {jar.x && (
                  <a
                    href={`https://x.com/${jar.x.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-white/40 hover:text-white/80"
                  >
                    @{jar.x.replace(/^@/, '')} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={share} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? 'link copied' : 'share'}
            </Button>
          </div>

          {jar.bio && <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-white/55">{jar.bio}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Metric label="received" value={`${received.toLocaleString()}`} suffix="VIBES" accent />
            <Metric label="tips" value={String(jar.tipCount ?? jarTips.length)} />
            <Metric label="tracks" value={String(jar.tracks.length)} />
            <span className="chip">
              <Link2 className="h-3 w-3" /> agent-discoverable
            </span>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        {/* ── left: tracks + tips ─────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">tracks</h2>
                <span className="text-[10.5px] uppercase tracking-wider text-white/20">
                  previews via Audius
                </span>
              </div>
              <div className="space-y-1.5">
                {jar.tracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>

          {agentTips.length > 0 && (
            <Card className="border-vibe-400/20 bg-gradient-to-br from-vibe-400/[0.08] via-transparent to-aura-500/[0.05]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-vibe-400/35 bg-vibe-400/15">
                    <Bot className="h-4 w-4 text-vibe-300" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white/90">
                      The VibeMusic agent tipped this artist
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-white/45">
                      It holds $VIBES only — every unit of gas was sponsored by the Cloudflare relayer.
                    </p>
                    <div className="mt-2.5 space-y-1.5">
                      {agentTips.slice(0, 3).map((t) => (
                        <div key={t.id} className="rounded-xl border border-white/[0.06] bg-black/25 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[12px] text-white/70">
                              {t.trackTitle ? `“${t.trackTitle}”` : 'agent tip'}
                            </p>
                            <span className="num shrink-0 text-[11.5px] font-semibold text-vibe-300">
                              +{t.amount}
                            </span>
                          </div>
                          {t.reason && (
                            <p className="mt-1 text-[11px] leading-relaxed text-white/40">{t.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">recent tips</h2>
                <span className="num text-[10.5px] text-white/25">{jarTips.length} total</span>
              </div>
              <TipsFeed tips={jarTips} empty="No tips yet — send the first one and it shows up here instantly." />
            </CardContent>
          </Card>
        </div>

        {/* ── right: tip panel ────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <TipPanel
            jar={jar}
            onTipped={(tip) => setData((d) => (d ? { ...d, tips: [tip, ...d.tips] } : d))}
          />

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                <Fuel className="h-3 w-3 text-vibe-300/70" /> how tipping works
              </div>
              <ul className="mt-2.5 space-y-2 text-[11.5px] leading-relaxed text-white/40">
                <li className="flex gap-2">
                  <span className="text-vibe-300/70">01</span> You send $VIBES from your wallet straight to{' '}
                  <span className="num text-white/60">{shortAddress(jar.wallet)}</span>.
                </li>
                <li className="flex gap-2">
                  <span className="text-vibe-300/70">02</span> The jar reads the transfer on Base and shows it here.
                </li>
                <li className="flex gap-2">
                  <span className="text-vibe-300/70">03</span> The agent can tip too — gasless, signed off-chain.
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-aura-300" />
              <p className="text-[12px] font-medium text-white/70">Want the agent to notice you?</p>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/35">
              Keep your Audius metadata rich — genre, mood, tags and artwork all feed the scoring rules.
            </p>
          </div>
        </div>
      </div>

      {agentTips.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">
              agent reasoning log
            </h2>
            <AgentActivity
              events={agentTips.map((t, i) => ({
                id: t.id,
                at: t.timestamp,
                missionId: t.missionId ?? 'n/a',
                prompt: 'tip this artist',
                stage: 'relay' as const,
                text: `Tipped ${t.amount} $VIBES for “${t.trackTitle ?? 'a track'}”`,
                detail: t.reason,
                txHash: t.txHash,
                amount: t.amount,
                trackTitle: t.trackTitle,
                artwork: jar.tracks.find((x) => x.id === t.trackId)?.artwork,
              }))}
              limit={6}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-1.5',
        accent ? 'border-vibe-400/25 bg-vibe-400/10' : 'border-white/[0.07] bg-white/[0.025]',
      )}
    >
      <span className={cn('num text-[13px] font-semibold', accent ? 'text-vibe-200' : 'text-white/80')}>{value}</span>
      {suffix && <span className="ml-1 text-[10px] font-medium text-vibe-200/60">{suffix}</span>}
      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-white/25">{label}</span>
    </div>
  );
}

function JarSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    </div>
  );
}
