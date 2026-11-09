import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'vibe' | 'aura' | 'amber' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-white/[0.08] bg-white/[0.04] text-white/60',
  vibe: 'border-vibe-400/25 bg-vibe-400/10 text-vibe-200',
  aura: 'border-aura-400/25 bg-aura-400/10 text-aura-300',
  amber: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  danger: 'border-red-400/25 bg-red-400/10 text-red-300',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Dot({ tone = 'vibe', pulse }: { tone?: Tone; pulse?: boolean }) {
  const color =
    tone === 'vibe' ? 'bg-vibe-300' : tone === 'aura' ? 'bg-aura-400' : tone === 'amber' ? 'bg-amber-300' : 'bg-white/40';
  return (
    <span className="relative flex h-1.5 w-1.5">
      {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', color)} />}
      <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', color)} />
    </span>
  );
}
