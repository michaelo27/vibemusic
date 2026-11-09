/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

/**
 * VibeMusic is a **fully static** Next.js app (App Router) deployed to Cloudflare
 * Pages for $0 - no server adapter, no SSR, no runtime.
 *
 * There are deliberately **no dynamic route folders**: production emits a plain
 * HTML export, and Cloudflare Pages `_redirects` (public/_redirects) serves the
 * two public shells, which read the wallet/handle out of the URL:
 *
 *   /tip/0xabc...  -> /tip/index.html   (client reads the wallet from location)
 *   /@handle     -> /u/index.html     (client reads the handle from location)
 *   /0xabc...      -> /tip/index.html
 *
 * In `next dev` small rewrites keep those exact URLs working locally.
 */
const nextConfig = {
  // Static HTML export for Pages (skipped in dev so the dev server stays fast).
  ...(isDev ? {} : { output: 'export' }),
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  // Keep peak memory lower during `next build` (small CI runners).
  experimental: { cpus: 1 },

  /**
   * @coinbase/cdp-sdk (reached via wagmi -> @base-org/account, i.e. the Coinbase
   * Wallet connector) imports the optional `@x402/*` micropayment packages with
   * plain `import()` calls. They are declared as *optional* peer dependencies,
   * so npm never installs them - and webpack resolves every specifier it can
   * see, so `next dev` / `next build` die with:
   *
   *   Module not found: Can't resolve '@x402/evm/upto/client'
   *
   * VibeMusic never touches x402 (we send gasless EIP-712 tips, not paid API
   * calls), so stub the whole family to `false` = "ignore this module".
   * Harmless for the browser bundle and it keeps the dependency tree free of an
   * ~11 MB payment protocol + Solana SDK we would never call.
   */
  webpack: (config) => {
    const unusedOptionalModules = [
      '@x402/core',
      '@x402/core/client',
      '@x402/evm',
      '@x402/evm/exact/client',
      '@x402/evm/upto/client',
      '@x402/extensions',
      '@x402/svm',
      '@x402/svm/exact/client',
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      ...Object.fromEntries(unusedOptionalModules.map((m) => [m, false])),
    };
    return config;
  },
  ...(isDev
    ? {
        async rewrites() {
          return [
            { source: '/@:handle', destination: '/u/?h=:handle' },
            { source: '/tip/:wallet', destination: '/tip/?w=:wallet' },
          ];
        },
      }
    : {}),
};

export default nextConfig;
