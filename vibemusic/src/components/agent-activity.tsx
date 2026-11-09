'use client';

import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleSlash,
  PenLine,
  Radar,
  Send,
  TriangleAlert,
} from 'lucide-react';
import { Artwork } from '@/components/artwork';
import type { AgentEvent } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { txUrl } from '@/lib/vibes';

const META: Record<
  AgentEvent['stage'],
  { icon: typeof Radar; tone: string; label: string }
> = {
  discover: { icon: Radar, tone: 'text-sky-300/80 border-sky-400/20 bg-sky-400/[0.08]', label: 'discover' },
  evaluate: { icon: BrainCircuit, tone: 'text-aura-300 border-aura-400/20 bg-aura-400/[0.08]', label: 'evaluate' },
  select: { icon: BrainCircuit, tone: 'text-aura-300 border-aura-400/20 bg-aura-400/[0.08]', label: 'select' },
  sign: { icon: PenLine, tone: 'text-amber-200 border-amber-400/20 bg-amber-400/[0.08]', label: 'sign' },
  relay: { icon: Send, tone: 'text-vibe-200 border-vibe-400/30 bg-vibe-400/[0.1]', label: 'tip' },
  skip: { icon: CircleSlash, tone: 'text-white/40 border-white/10 bg-white/[0.03]', label: 'skip' },
  done: { icon: CheckCircle2, tone: 'text-vibe-300 border-vibe-400/20 bg-vibe-400/[0.06]', label: 'done' },
  error: { icon: TriangleAlert, tone: 'text-red-300 border-red-400/20 bg-red-400/[0.08]', label: 'error' },
};

export function AgentActivity({
  events,
  limit = 8,
  className,
}: {
  events: AgentEvent[];
  limit?: number;
  className?: string;
}) {
  if (!events.length) {
    return (
      <div className={cn('rounded-2xl border border-dashed border-white/[0.08] px-4 py-10 text-center', className)}>
        <p className="text-[13px] text-white/35">The agent hasn&apos;t run yet. Give it a mission.</p>
      </div>
    );
  }

  return (
    <ol className={cn('relative space-y-1', className)}>
      <span className="absolute bottom-3 left-[15px] top-3 w-px bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-transparent" />
      {events.slice(0, limit).map((e) => {
        const meta = META[e.stage] ?? META.evaluate;
        const Icon = meta.icon;
        const href = txUrl(e.txHash);
        return (
          <li key={e.id} className="relative flex gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.025]">
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border',
                meta.tone,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>

            <div className="min-w-0 flex-1 pb-1.5">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-[12.5px] leading-relaxed text-white/75">{e.text}</p>
                <span className="shrink-0 pt-0.5 text-[10.5px] text-white/25">{timeAgo(e.at)}</span>
              </div>

              {e.detail && <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-white/35">{e.detail}</p>}

              <div className="mt-1 flex items-center gap-2">
                {e.amount && (
                  <span className="num rounded-md bg-vibe-400/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-vibe-200">
                    +{e.amount} VIBES
                  </span>
                )}
                {e.artwork && (
                  <Artwork src={e.artwork} seed={e.trackTitle ?? e.id} className="h-6 w-6" name={e.trackTitle} />
                )}
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10.5px] text-white/25 hover:text-vibe-300"
                  >
                    tx <ArrowUpRight className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StagePill({ stage }: { stage: AgentEvent['stage'] }) {
  const meta = META[stage] ?? META.evaluate;
  return (
    <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider', meta.tone)}>
      {meta.label}
    </span>
  );
}
