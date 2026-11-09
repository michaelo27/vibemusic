import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BASESCAN, VIBES_TOKEN } from '@/lib/vibes';
import { shortAddress } from '@/lib/utils';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.05] bg-black/20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/40">
            Tip jars for Audius artists. Humans tip in <span className="text-white/70">$VIBES</span> on Base — and an
            autonomous agent discovers good music and tips too, with every unit of gas sponsored by a Cloudflare
            relayer.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`${BASESCAN}/token/${VIBES_TOKEN}`}
              target="_blank"
              rel="noreferrer"
              className="chip hover:text-white/80"
            >
              $VIBES {shortAddress(VIBES_TOKEN, 6)} <ExternalLink className="h-3 w-3" />
            </a>
            <span className="chip">Base mainnet</span>
            <span className="chip">gasless for the agent</span>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Product</h4>
          <ul className="space-y-2 text-[13px] text-white/50">
            <li><Link className="link-underline hover:text-white" href="/#discover">Discover jars</Link></li>
            <li><Link className="link-underline hover:text-white" href="/create">Create a tip jar</Link></li>
            <li><Link className="link-underline hover:text-white" href="/agent">Agent console</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Built with</h4>
          <ul className="space-y-2 text-[13px] text-white/50">
            <li><a className="link-underline hover:text-white" href="https://audius.co" target="_blank" rel="noreferrer">Audius API</a></li>
            <li><a className="link-underline hover:text-white" href="https://base.org" target="_blank" rel="noreferrer">Base</a></li>
            <li><a className="link-underline hover:text-white" href="https://workers.cloudflare.com" target="_blank" rel="noreferrer">Cloudflare Workers</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.04] px-4 py-5 text-center text-[11.5px] text-white/25 sm:px-6">
        VibeMusic · Vibestarter Vibeathon 02 · every tip is visible on-chain. Demo-mode data is local to your browser.
      </div>
    </footer>
  );
}
