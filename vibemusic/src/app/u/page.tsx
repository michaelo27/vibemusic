import { JarScreen } from '@/components/jar-screen';

/**
 * Artist shell for vanity handles: `/@luna` is rewritten to /u/index.html by
 * Cloudflare Pages, and the client resolves the handle from the URL.
 */
export default function ArtistPage() {
  return <JarScreen />;
}
