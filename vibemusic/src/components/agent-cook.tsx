'use client';

import {
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Check,
  CircleDot,
  Fuel,
  Loader2,
  PenLine,
  Play,
  Radar,
  Send,
  Sparkles,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Artwork } from '@/components/artwork';
import { Badge, Dot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import type { AgentMission } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { txUrl } from '@/lib/vibes';

const PHASES = [
  { key: 'discover', label: 'Discovering on Audius', hint: '/v1/tracks/trending · /v1/tracks/search', icon: Radar },
  { key: 'evaluate', label: 'Scoring every candidate', hint: 'genre · mood · engagement · craft', icon: BrainCircuit },
  { key: 'select', label: 'Matching tracks to tip jars', hint: 'Audius handle → wallet', icon: CircleDot },
  { key: 'sign', label: 'Signing EIP-712 authorizations', hint: 'the agent needs $VIBES only — no ETH', icon: PenLine },
  { key: 'relay', label: 'Relaying tips on Base', hint: 'Cloudflare Worker sponsors the gas', icon: Send },
];

export function AgentCook({
  onDone,
  defaultPrompt,
  title = 'Let the agent cook',
  subtitle = 'Give the agent a mission. It discovers tracks on Audius, judges them, and pays the artists in $VIBES — signing off-chain while a Cloudflare Worker covers every unit of gas.',
  showCustom = true,
}: {
  onDone?: (m: AgentMission) => void;
  defaultPrompt?: string;
  title?: string;
  subtitle?: string;
  showCustom?: boolean;
}) {
  const { toast } = useToast();
  const [prompt, setPrompt] = React.useState(defaultPrompt ?? api.presets[0].prompt);
  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState(0);
  const [mission, setMission] = React.useState<AgentMission | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!running) return;
    setPhase(0);
    const t = setInterval(() => setPhase((p) => Math.min(p + 1, PHASES.length - 1)), 1100);
    return () => clearInterval(t);
  }, [running]);

  async function run(p?: string) {
    const text = (p ?? prompt).trim();
    if (!text || running) return;
    setPrompt(text);
    setRunning(true);
    setError(null);
    setMission(null);
    try {
      const m = await api.runMission(text);
      setMission(m);
      onDone?.(m);
      if (m.tipped > 0) {
        toast({
          title: `Agent tipped ${m.tipped} artist${m.tipped === 1 ? '' : 's'}`,
          description: `${m.totalAmount} $VIBES · gas sponsored by the relayer`,
          tone: 'success',
        });
      } else {
        toast({
          title: 'Mission finished with no tips',
          description: m.steps.find((s) => s.stage === 'skip')?.text ?? 'No track cleared the quality bar.',
          tone: 'info',
        });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Mission failed';
      setError(msg);
      toast({ title: 'Agent mission failed', description: msg, tone: 'error' });
    } finally {
      setRunning(false);
    }
  }

  const tipSteps = mission?.steps.filter((s) => s.stage === 'relay') ?? [];
  const skips = mission?.steps.filter((s) => s.stage === 'skip') ?? [];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-1">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-vibe-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-aura-500/15 blur-3xl" />

      <div className="relative rounded-[22px] bg-ink-950/40 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="relative mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-vibe-400/30 bg-vibe-400/10">
              <Bot className="h-4 w-4 text-vibe-300" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vibe-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-vibe-300" />
              </span>
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-white/45">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone="vibe">
              <Fuel className="h-3 w-3" /> gasless
            </Badge>
            <Badge tone="aura">EIP-712</Badge>
          </div>
        </div>

        {/* mission presets */}
        <div className="mt-5">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/30">missions</div>
          <div className="flex flex-wrap gap-2">
            {api.presets.map((p) => (
              <button
                key={p.id}
                disabled={running}
                onClick={() => run(p.prompt)}
                className={cn(
                  'group flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[12.5px] font-medium transition-all disabled:opacity-40',
                  prompt === p.prompt
                    ? 'border-vibe-400/40 bg-vibe-400/10 text-vibe-100'
                    : 'border-white/[0.07] bg-white/[0.025] text-white/60 hover:border-white/20 hover:bg-white/[0.05] hover:text-white/90',
                )}
              >
                <span className="text-[13px]">{p.emoji}</span>
                <span className="max-w-[240px] truncate">{p.label}</span>
                <Play className="h-3 w-3 opacity-0 transition group-hover:opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {showCustom && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="Custom mission — e.g. “tip underrated afrobeats artists with tiny play counts”"
              className="field h-11 flex-1"
              disabled={running}
            />
            <Button variant="accent" size="md" className="h-11 px-5" onClick={() => run()} loading={running}>
              {running ? 'Agent is working…' : 'Run mission'}
            </Button>
          </div>
        )}

        {/* live phase rail */}
        {(running || mission || error) && (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1.2fr]">
            <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  <Dot pulse={running} /> {running ? 'agent running' : error ? 'failed' : 'run trace'}
                </span>
                <span className="num text-[11px] text-white/25">{timeAgo(mission?.finishedAt ?? Date.now())}</span>
              </div>

              <ol className="space-y-2.5">
                {PHASES.map((p, i) => {
                  const done = !running && !!mission;
                  const active = running && i === phase;
                  const complete = done || (running && i < phase);
                  return (
                    <li key={p.key} className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                          complete
                            ? 'border-vibe-400/40 bg-vibe-400/15 text-vibe-300'
                            : active
                              ? 'border-vibe-400/40 bg-transparent text-vibe-300'
                              : 'border-white/10 bg-white/[0.02] text-white/20',
                        )}
                      >
                        {complete ? (
                          <Check className="h-3 w-3" />
                        ) : active ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <p.icon className="h-2.5 w-2.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-[12.5px] font-medium transition-colors',
                            complete ? 'text-white/70' : active ? 'text-white' : 'text-white/30',
                          )}
                        >
                          {p.label}
                        </p>
                        <p className="truncate text-[10.5px] text-white/25">{p.hint}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {mission && (
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                  <MiniStat label="scanned" value={mission.considered} />
                  <MiniStat label="tipped" value={mission.tipped} accent />
                  <MiniStat label="$VIBES" value={mission.totalAmount} accent />
                </div>
              )}
            </div>

            {/* outcome */}
            <div className="min-h-[180px] rounded-2xl border border-white/[0.06] bg-black/30 p-4">
              {running && (
                <div className="flex h-full flex-col justify-center gap-3 py-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-vibe-400/30 bg-vibe-400/10">
                    <Sparkles className="h-4 w-4 animate-pulse text-vibe-300" />
                  </div>
                  <p className="text-[13px] font-medium text-white/80">Agent is tipping…</p>
                  <p className="mx-auto max-w-[260px] text-[11.5px] leading-relaxed text-white/35">
                    reading Audius metadata, scoring tracks and signing authorizations. On-chain settlement usually
                    takes a few seconds per tip.
                  </p>
                </div>
              )}

              {error && !running && (
                <div className="flex items-start gap-2 text-[12.5px] text-red-300">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Mission failed</p>
                    <p className="mt-1 break-words text-red-200/70">{error}</p>
                  </div>
                </div>
              )}

              {mission && !running && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">agent receipts</p>
                    <Link href="/agent" className="flex items-center gap-1 text-[11px] text-vibe-300/80 hover:text-vibe-200">
                      console <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {tipSteps.length === 0 && (
                    <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[12px] leading-relaxed text-white/40">
                      Nothing cleared the bar this time. {skips[0]?.text ?? 'Try a different mission wording.'}
                    </p>
                  )}

                  {tipSteps.map((s, i) => (
                    <div
                      key={`${s.txHash}-${i}`}
                      className="animate-fade-up rounded-xl border border-vibe-400/[0.18] bg-vibe-400/[0.06] p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Artwork src={s.artwork} seed={s.trackTitle ?? s.text} name={s.artist} className="h-9 w-9" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-medium text-white/90">{s.trackTitle ?? s.text}</p>
                          <p className="truncate text-[11px] text-white/40">@{s.artist}</p>
                        </div>
                        <span className="num shrink-0 rounded-md bg-vibe-400/15 px-1.5 py-0.5 text-[11px] font-semibold text-vibe-200">
                          +{s.amount}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/45">{s.detail}</p>
                      {txUrl(s.txHash) && (
                        <a
                          href={txUrl(s.txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-white/30 hover:text-vibe-300"
                        >
                          view tx <ArrowUpRight className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  ))}

                  {skips.length > 0 && (
                    <p className="pt-1 text-[10.5px] leading-relaxed text-white/25">
                      {skips.length} skipped · {skips[0].text}
                    </p>
                  )}
                </div>
              )}

              {!running && !mission && !error && (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                    <Wallet className="h-4 w-4 text-white/40" />
                  </div>
                  <p className="text-[12.5px] text-white/45">Pick a mission to watch the agent think, sign and pay.</p>
                  <p className="max-w-[260px] text-[11px] leading-relaxed text-white/25">
                    It holds $VIBES only. Every transaction fee is paid by the relayer.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <p className={cn('num text-[15px] font-semibold', accent ? 'text-vibe-300' : 'text-white/80')}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/25">{label}</p>
    </div>
  );
}
