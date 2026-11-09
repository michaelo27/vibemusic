import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Static-export friendly links.
 *
 * `next/link` prefetches RSC payloads for routes that must already exist at
 * build time. Public jar pages are produced at request time by Cloudflare
 * Pages `_redirects` (see public/_redirects), so we use plain anchors to force
 * a real document load — which also makes shared URLs work perfectly.
 */
export function JarLink({
  wallet,
  slug,
  className,
  children,
  onClick,
}: {
  wallet: string;
  slug?: string | null;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const href = slug ? `/@${slug}` : `/tip/${wallet}`;
  return (
    <a href={href} className={cn(className)} onClick={onClick}>
      {children}
    </a>
  );
}

export function jarHref(wallet: string, slug?: string | null) {
  return slug ? `/@${slug}` : `/tip/${wallet}`;
}

export function AddressLink({
  address,
  className,
  children,
}: {
  address: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={`https://basescan.org/address/${address}`}
      target="_blank"
      rel="noreferrer"
      className={cn('link-underline hover:text-white/80', className)}
    >
      {children ?? address}
    </a>
  );
}
