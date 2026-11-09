'use client';

import { ExternalLink, Headphones, Heart, Loader2, Pause, Play } from 'lucide-react';
import { Artwork } from '@/components/artwork';
import { Badge } from '@/components/ui/badge';
import { audiusTrackUrl } from '@/lib/audius';
import type { AudiusTrack } from '@/lib/types';
import { useAudioPlayer } from '@/lib/use-audio';
import { cn, formatDuration } from '@/lib/utils';

export function TrackRow({
  track,
  index,
  compact = false,
  onRemove,
}: {
  track: AudiusTrack;
  index?: number;
  compact?: boolean;
  onRemove?: () => void;
}) {
  const { playingId, loadingId, toggle } = useAudioPlayer();
  const isPlaying = playingId === track.id;
  const isLoading = loadingId === track.id;
  const href = audiusTrackUrl(track);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:border-white/[0.11] hover:bg-white/[0.045]',
        isPlaying && 'border-vibe-400/25 bg-vibe-400/[0.06]',
      )}
    >
      <button
        onClick={() => toggle(track.id, track.streamEndpoint || track.streamUrl)}
        className="relative shrink-0 overflow-hidden rounded-xl"
        aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
      >
        <Artwork
          src={track.artwork}
          seed={track.id}
          name={track.title}
          className={compact ? 'h-11 w-11' : 'h-14 w-14'}
        />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100',
            (isPlaying || isLoading) && 'opacity-100',
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4 fill-white text-white" />
          ) : (
            <Play className="h-4 w-4 fill-white text-white" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {index !== undefined && (
            <span className="num text-[11px] font-medium text-white/25">{String(index + 1).padStart(2, '0')}</span>
          )}
          <p className="truncate text-[13.5px] font-medium text-white/90">{track.title}</p>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-white/40">
          <span className="truncate">@{track.artistHandle || track.artist}</span>
          {track.duration ? <span className="num text-white/25">{formatDuration(track.duration)}</span> : null}
          {!compact && track.genre && <Badge tone="neutral">{track.genre}</Badge>}
          {!compact && track.mood && <Badge tone="aura">{track.mood}</Badge>}
        </div>
      </div>

      {!compact && (
        <div className="hidden items-center gap-3 pr-1 text-[11px] text-white/30 sm:flex">
          <span className="flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            {track.playCount ? track.playCount.toLocaleString() : '—'}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {track.favoriteCount ? track.favoriteCount.toLocaleString() : '—'}
          </span>
        </div>
      )}

      {href && !onRemove && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-1.5 text-white/25 transition hover:bg-white/[0.06] hover:text-white/70"
          aria-label="Open on Audius"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {onRemove && (
        <button
          onClick={onRemove}
          className="rounded-lg px-2 py-1 text-[11px] font-medium text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
        >
          remove
        </button>
      )}
    </div>
  );
}
