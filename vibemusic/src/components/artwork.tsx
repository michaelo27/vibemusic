'use client';

import { Music2 } from 'lucide-react';
import * as React from 'react';
import { cn, gradientFor, initials } from '@/lib/utils';

/**
 * Album/track artwork with a graceful fallback: if the Audius CDN image fails
 * (offline preview, expired url) we render a deterministic gradient + initials,
 * so every card still looks intentional.
 */
export function Artwork({
  src,
  seed,
  name,
  className,
  rounded = 'rounded-xl',
  icon,
}: {
  src?: string | null;
  seed: string;
  name?: string | null;
  className?: string;
  rounded?: string;
  icon?: React.ReactNode;
}) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn('relative shrink-0 overflow-hidden', rounded, className)}
      style={{ backgroundImage: gradientFor(seed) }}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? ''}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {icon ?? (
            name ? (
              <span className="text-sm font-semibold tracking-tight text-white/70">{initials(name)}</span>
            ) : (
              <Music2 className="h-4 w-4 text-white/40" />
            )
          )}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
    </div>
  );
}
