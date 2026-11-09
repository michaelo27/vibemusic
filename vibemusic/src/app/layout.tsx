import type { Metadata, Viewport } from 'next';
import { Background } from '@/components/background';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Providers } from './providers';
import './globals.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibemusic.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'VibeMusic — tip Audius artists in $VIBES on Base',
    template: '%s · VibeMusic',
  },
  description:
    'A tip jar for Audius artists paid in $VIBES on Base. Fans tip in one click — and an autonomous agent discovers good tracks, explains itself, and tips artists with gas sponsored by a Cloudflare Worker.',
  openGraph: {
    title: 'VibeMusic — tip Audius artists in $VIBES',
    description:
      'Humans tip. An autonomous agent tips too. $VIBES on Base, gas sponsored, artists paid directly.',
    url: SITE,
    siteName: 'VibeMusic',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeMusic — tip Audius artists in $VIBES',
    description: 'Humans tip. An autonomous agent tips too. $VIBES on Base with sponsored gas.',
  },
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%232BE79B'/%3E%3Cpath d='M13.6 3.4 6.2 12.9c-.4.5 0 1.1.6 1.1h3.6l-1.2 6.3c-.1.6.6 1 1.1.5l7.4-9.5c.4-.5 0-1.1-.6-1.1h-3.6l1.3-6.3c.1-.6-.6-1-1.1-.5Z' fill='%2305060A'/%3E%3C/svg%3E",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#05060A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh font-sans">
        <Providers>
          <Background />
          <SiteHeader />
          <main className="min-h-[70vh]">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
