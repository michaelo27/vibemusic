import { JarScreen } from '@/components/jar-screen';

export const metadata = {
  title: 'Tip jar',
  description: 'Tip this Audius artist in $VIBES on Base.',
};

/**
 * Public jar shell. `/tip/0xabc…` is rewritten here by Cloudflare Pages
 * (see public/_redirects) and the client reads the wallet from the URL.
 */
export default function TipPage() {
  return <JarScreen />;
}
