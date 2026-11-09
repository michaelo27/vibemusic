'use client';

import { ArrowUpRight, Music2, Sparkles } from 'lucide-react';
import { Artwork } from '@/components/artwork';
import { JarLink } from '@/components/links';
import type { TipJar } from '@/lib/types';
import { cn, shortAddress } from '@/lib/utils';

export function JarCard({ jar, index = 0 }: { jar: TipJar; index?: number }) {
  const tracks = jar.tracks ?? [];
  const received = Number(jar.totalReceived ?? 0);

  return (
    <JarLink
      wallet={jar.wallet}
      slug={jar.slug}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.022] p-1.5 transition-all duration-300',
        'hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.05] hover:shadow-[0_24px_60px_-30px_rgba(43,231,155,0.4)]',
      )}
    >
      <div className="relative h-36 overflow-hidden rounded-[18px] sm:h-40">
        {/* artwork collage: up to 3 track covers */}
        <div className="absolute inset-0 flex gap-0.5">
          {tracks.slice(0, 3).map((t, i) => (
            <Artwork
              key={t.id + i}
              src={t.artwork}
              seed={t.id}
              name={t.title}
              rounded="rounded-none"
              className={cn('h-full transition-transform duration-700 group-hover:scale-105', i === 0 ? 'flex-[2]' : 'flex-1')}
            />
          ))}
          {tracks.length === 0 && (
            <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
              <Music2 className="h-6 w-6 text-white/20" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-white">{jar.name}</h3>
            </div>
            <p className="truncate text-[11.5px] text-white/45">@{jar.slug}</p>
          </div>
          <span className="num shrink-0 rounded-full border border-vibe-400/25 bg-vibe-400/15 px-2 py-0.5 text-[11px] font-semibold text-vibe-200">
            {received > 0 ? `${received.toLocaleString()} VIBES` : 'new'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-3">
        <p className="line-clamp-2 min-h-[34px] text-[12.5px] leading-relaxed text-white/45">
          {jar.bio || 'Independent artist on Audius.'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-white/35">
            <Music2 className="h-3 w-3" />
            {tracks.length} track{tracks.length === 1 ? '' : 's'}
            <span className="text-white/15">·</span>
            <span className="num">{jar.tipCount ?? 0}</span> tips
          </div>
          <span className="flex items-center gap-1 text-[11px] font-medium text-white/35 transition group-hover:text-vibe-300">
            open jar <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {index === 0 && received > 0 && (
        <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur">
          <Sparkles className="h-2.5 w-2.5 text-vibe-300" /> top jar
        </span>
      )}
    </JarLink>
  );
}

export function JarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.022] p-1.5">
      <div className="h-36 animate-pulse rounded-[18px] bg-white/[0.04] sm:h-40" />
      <div className="space-y-2 px-3 pb-3 pt-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.04]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.03]" />
      </div>
    </div>
  );
}

export function JarMini({ jar }: { jar: TipJar }) {
  return (
    <JarLink
      wallet={jar.wallet}
      slug={jar.slug}
      className="group flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition hover:border-white/[0.12] hover:bg-white/[0.045]"
    >
      <Artwork
        src={jar.image || jar.tracks?.[0]?.artwork}
        seed={jar.wallet}
        name={jar.name}
        className="h-10 w-10"
        rounded="rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white/85">{jar.name}</p>
        <p className="truncate text-[11px] text-white/35">
          @{jar.slug} · {shortAddress(jar.wallet)}
        </p>
      </div>
      <span className="num text-[11px] text-vibe-200/80">{Number(jar.totalReceived ?? 0).toLocaleString()} V</span>
    </JarLink>
  );
}
