'use client';

import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Fuel,
  KeyRound,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import * as React from 'react';
import { AgentActivity } from '@/components/agent-activity';
import { AgentCook } from '@/components/agent-cook';
import { Badge, Dot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, SectionHeading } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { api, IS_DEMO } from '@/lib/api';
import type { AgentEvent, AgentMission, AgentState } from '@/lib/types';
import { cn, shortAddress, timeAgo } from '@/lib/utils';
import { addressUrl } from '@/lib/vibes';

export default function AgentPage() {
  const { toast } = useToast();
  const [state, setState] = React.useState<AgentState | null>(null);
  const [missions, setMissions] = React.useState<AgentMission[]>([]);
  const [events, setEvents] = React.useState<AgentEvent[]>([]);
  const [copied, setCopied] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [s, m, e] = await Promise.all([
      api.agentState().catch(() => null),
      api.missions(12).catch(() => []),
      api.agentEvents(40).catch(() => []),
    ]);
    setState(s);
    setMissions(m);
    setEvents(e);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function copy(text: string, label: string) {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <SectionHeading
        eyebrow="autonomous agent"
        title="Agent console"
        description="The agent holds only $VIBES. It signs EIP-712 tip authorizations off-chain; the Cloudflare Worker verifies them and pays the gas."
        action={
          <div className="flex gap-1.5">
            <Button variant="secondary" size="sm" onClick={() => void load()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> refresh
            </Button>
            {IS_DEMO && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  api.resetDemo();
                  void load();
                  toast({ title: 'Demo data reset', tone: 'info' });
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" /> reset
              </Button>
            )}
          </div>
        }
      />

      {/* ── wallet cards ──────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-vibe-400/15 blur-2xl" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
                <Bot className="h-3 w-3 text-vibe-300" /> agent wallet
              </span>
              <Badge tone="vibe">
                <Fuel className="h-3 w-3" /> 0 ETH
              </Badge>
            </div>

            {state ? (
              <>
                <button
                  onClick={() => copy(state.agentAddress, 'agent')}
                  className="mt-2.5 flex items-center gap-1.5 text-[13px] text-white/75 hover:text-white"
                >
                  <span className="num">{shortAddress(state.agentAddress, 8)}</span>
                  {copied === 'agent' ? (
                    <Check className="h-3 w-3 text-vibe-300" />
                  ) : (
                    <Copy className="h-3 w-3 text-white/25" />
                  )}
                </button>
                <div className="mt-3 flex items-end gap-2">
                  <p className="num text-2xl font-semibold text-vibe-300">{state.vibesBalance}</p>
                  <span className="pb-1 text-[11px] font-medium text-white/35">$VIBES</span>
                </div>
                <p className="mt-1 text-[11px] text-white/30">
                  {state.tipsToday ?? 0} tips today · {state.spendToday ?? '0'} VIBES spent
                </p>
              </>
            ) : (
              <Skeleton className="mt-3 h-14 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
              <ShieldCheck className="h-3 w-3 text-aura-300" /> relayer · gas tank
            </span>
            {state ? (
              <>
                <a
                  href={addressUrl(state.relayerAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="num mt-2.5 flex items-center gap-1.5 text-[13px] text-white/75 hover:text-white"
                >
                  {shortAddress(state.relayerAddress, 8)}
                  <ArrowUpRight className="h-3 w-3 text-white/25" />
                </a>
                <div className="mt-3 flex items-end gap-2">
                  <p className="num text-2xl font-semibold text-white/90">{state.relayerEthBalance}</p>
                  <span className="pb-1 text-[11px] font-medium text-white/35">ETH</span>
                </div>
                <p className="mt-1 text-[11px] text-white/30">
                  pays every agent tip · {state.maxTipAmount} VIBES max per tip
                </p>
              </>
            ) : (
              <Skeleton className="mt-3 h-14 w-full" />
            )}
          </CardContent>
        </Card>

        <Card className={cn(state && !state.approved && 'border-amber-400/25 bg-amber-400/[0.04]')}>
          <CardContent className="p-5">
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
              <KeyRound className="h-3 w-3 text-amber-200" /> spend approval
            </span>
            {state ? (
              <>
                <div className="mt-2.5 flex items-center gap-2">
                  {state.approved ? (
                    <Check className="h-4 w-4 text-vibe-300" />
                  ) : (
                    <TriangleAlert className="h-4 w-4 text-amber-300" />
                  )}
                  <p className="text-[13.5px] font-medium text-white/85">
                    {state.approved ? 'Relayer approved to spend' : 'Activation required'}
                  </p>
                </div>
                <p className="num mt-2 text-[12px] text-white/45">allowance: {state.allowance} VIBES</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/30">
                  {state.approved
                    ? 'The agent wallet holds $VIBES only — the relayer can pull tips but cannot move anything else.'
                    : 'Run `npm run agent:activate` once so the relayer can pull tips from the agent wallet.'}
                </p>
              </>
            ) : (
              <Skeleton className="mt-3 h-14 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── runner ────────────────────────────────────────────── */}
      <div className="mt-6">
        <AgentCook
          onDone={() => void load()}
          title="Run a mission"
          subtitle="Missions are free-form. The agent parses your intent into genre/mood/freshness weights, scores the Audius catalogue, then signs and relays tips for the best matches that have a VibeMusic jar."
        />
      </div>

      {/* ── missions + log ────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <Activity className="h-3.5 w-3.5 text-vibe-300" /> missions
              </h2>
              <span className="num text-[10.5px] text-white/25">{missions.length}</span>
            </div>
            <div className="space-y-2">
              {missions.map((m) => (
                <MissionRow key={m.id} mission={m} />
              ))}
              {missions.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/[0.07] px-3 py-8 text-center text-[12px] text-white/30">
                  No missions yet — run one above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">activity log</h2>
              <span className="flex items-center gap-1.5 text-[10.5px] text-white/25">
                <Dot pulse /> live
              </span>
            </div>
            <AgentActivity events={events} limit={14} />
          </CardContent>
        </Card>
      </div>

      {/* ── explainer ─────────────────────────────────────────── */}
      <Card className="mt-4">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">
            how an agent tip settles
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '01',
                t: 'Discover',
                d: 'GET api.audius.co/v1/tracks/trending + /search — free, keyless.',
                i: Wallet,
              },
              {
                n: '02',
                t: 'Judge',
                d: 'Deterministic 0–100 score: genre, mood, engagement, craft, freshness.',
                i: Bot,
              },
              {
                n: '03',
                t: 'Sign',
                d: 'EIP-712 TipAuthorization signed by the agent wallet. No gas, no ETH.',
                i: KeyRound,
              },
              {
                n: '04',
                t: 'Relay',
                d: 'Worker verifies the signature, calls transferFrom, pays the gas, stores the receipt.',
                i: Fuel,
              },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <s.i className="h-3.5 w-3.5 text-vibe-300/80" />
                  <span className="num text-[10px] text-white/20">{s.n}</span>
                </div>
                <p className="mt-2.5 text-[12.5px] font-semibold text-white/85">{s.t}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/35">{s.d}</p>
              </div>
            ))}
          </div>

          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/40 p-4 text-[11px] leading-relaxed text-white/45">
{`// the agent signs this — the Worker verifies it, then relays
domain = { name: "VibeMusic", version: "1", chainId: 8453 }
types  = { TipAuthorization: [
  from, to, amount, nonce, deadline, missionId, reason, trackId ] }

// Worker → VIBES.transferFrom(agent, artist, amount)   (relayer pays gas)`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function MissionRow({ mission }: { mission: AgentMission }) {
  const [open, setOpen] = React.useState(false);
  const steps = mission.steps.slice(0, open ? 99 : 3);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-2.5 text-left">
        <span className="mt-1">
          <Dot tone={mission.tipped > 0 ? 'vibe' : 'neutral'} pulse={mission.status === 'running'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-white/85">{mission.prompt}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-white/30">
            <span>{timeAgo(mission.createdAt)}</span>
            <span className="text-white/15">·</span>
            <span className="num">{mission.considered} scanned</span>
            <span className="num text-vibe-300/80">{mission.tipped} tipped</span>
            <span className="num">{mission.totalAmount} VIBES</span>
            {mission.evaluator && <span className="chip py-0">{mission.evaluator}</span>}
          </div>
        </div>
        <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-white/25 transition', open && 'rotate-180')} />
      </button>

      <ol className="mt-2.5 space-y-1.5 border-l border-white/[0.07] pl-3">
        {steps.map((s, i) => (
          <li key={i} className="text-[11px] leading-relaxed text-white/40">
            <span
              className={cn(
                'mr-1.5 font-semibold uppercase tracking-wider',
                s.stage === 'relay'
                  ? 'text-vibe-300/80'
                  : s.stage === 'skip'
                    ? 'text-white/25'
                    : s.stage === 'error'
                      ? 'text-red-300/80'
                      : 'text-aura-300/70',
              )}
            >
              {s.stage}
            </span>
            {s.text}
            {s.detail && <span className="text-white/25"> — {s.detail}</span>}
          </li>
        ))}
        {!open && mission.steps.length > 3 && (
          <li className="text-[10.5px] text-white/20">+{mission.steps.length - 3} more…</li>
        )}
      </ol>
    </div>
  );
}
