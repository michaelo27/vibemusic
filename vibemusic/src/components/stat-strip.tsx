'use client';

import { Bot, Coins, Music4, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Stats } from '@/lib/types';

export function StatStrip({ stats, loading }: { stats?: Stats | null; loading?: boolean }) {
  const items = [
    { label: 'Tip jars', value: stats?.jarCount, icon: Users, accent: false },
    { label: 'Tracks linked', value: stats?.trackCount, icon: Music4, accent: false },
    { label: 'Tips sent', value: stats?.tipCount, icon: Coins, accent: false },
    { label: 'Agent tips', value: stats?.agentTipCount, icon: Bot, accent: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {items.map((i) => (
        <div
          key={i.label}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.022] px-3.5 py-3 transition-colors hover:border-white/[0.12]"
        >
          <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-white/30">
            <i.icon className={i.accent ? 'h-3 w-3 text-vibe-300/70' : 'h-3 w-3'} />
            {i.label}
          </div>
          {loading || i.value === undefined ? (
            <Skeleton className="mt-2 h-6 w-14" />
          ) : (
            <p className={`num mt-1 text-lg font-semibold ${i.accent ? 'text-vibe-300' : 'text-white/90'}`}>
              {i.value.toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
