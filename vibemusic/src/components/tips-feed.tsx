'use client';

import { Bot, ExternalLink, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Tip } from '@/lib/types';
import { cn, shortAddress, timeAgo } from '@/lib/utils';
import { txUrl } from '@/lib/vibes';

export function TipsFeed({
  tips,
  nameFor,
  compact = false,
  empty = 'No tips yet — be the first.',
  className,
}: {
  tips: Tip[];
  nameFor?: (wallet: string) => string | undefined;
  compact?: boolean;
  empty?: string;
  className?: string;
}) {
  if (!tips.length) {
    return (
      <div className={cn('rounded-2xl border border-dashed border-white/[0.08] px-4 py-10 text-center', className)}>
        <p className="text-[13px] text-white/35">{empty}</p>
      </div>
    );
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {tips.slice(0, compact ? 5 : 50).map((tip) => (
        <TipRow key={tip.id} tip={tip} nameFor={nameFor} />
      ))}
    </ul>
  );
}

export function TipRow({ tip, nameFor }: { tip: Tip; nameFor?: (wallet: string) => string | undefined }) {
  const toName = nameFor?.(tip.to);
  const href = txUrl(tip.txHash);

  return (
    <li
      className={cn(
        'group animate-fade-up rounded-2xl border p-3 transition-colors',
        tip.isAgent
          ? 'border-vibe-400/[0.16] bg-gradient-to-r from-vibe-400/[0.07] to-transparent hover:border-vibe-400/25'
          : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1]',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
            tip.isAgent
              ? 'border-vibe-400/40 bg-vibe-400/15 text-vibe-200'
              : 'border-white/10 bg-white/[0.06] text-white/55',
          )}
        >
          {tip.isAgent ? <Bot className="h-3.5 w-3.5" /> : tip.from.slice(2, 4).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px]">
            <span className="font-medium text-white/85">{tip.isAgent ? 'Agent' : shortAddress(tip.from)}</span>
            <span className="text-white/30">tipped</span>
            <span className="num font-semibold text-vibe-300">{Number(tip.amount).toLocaleString()} VIBES</span>
            {toName && (
              <>
                <span className="text-white/30">to</span>
                <span className="font-medium text-white/85">{toName}</span>
              </>
            )}
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-white/25">
              {timeAgo(tip.timestamp)}
              {href && (
                <a href={href} target="_blank" rel="noreferrer" className="hover:text-white/70" aria-label="View tx">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          </div>

          {tip.trackTitle && (
            <p className="mt-1 truncate text-[11.5px] text-white/35">
              for <span className="text-white/55">“{tip.trackTitle}”</span>
            </p>
          )}

          {tip.message && (
            <p className="mt-1.5 flex items-start gap-1 text-[12.5px] leading-relaxed text-white/60">
              <Quote className="mt-0.5 h-3 w-3 shrink-0 text-white/20" />
              <span className="line-clamp-3">{tip.message}</span>
            </p>
          )}

          {tip.isAgent && tip.reason && (
            <div className="mt-2 rounded-xl border border-white/[0.05] bg-black/30 px-2.5 py-1.5">
              <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-vibe-300/70">
                why the agent tipped
              </div>
              <p className="text-[11.5px] leading-relaxed text-white/50">{tip.reason}</p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function AgentBadge({ className }: { className?: string }) {
  return (
    <Badge tone="vibe" className={className}>
      <Bot className="h-3 w-3" /> agent
    </Badge>
  );
}
