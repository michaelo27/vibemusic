'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import type { WalletList } from '@rainbow-me/rainbowkit';
import { coinbaseWallet, injectedWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || '';
const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

/**
 * WalletConnect (QR / mobile wallets) needs a free Reown project id.
 * Injected wallets (MetaMask, Rabby, Coinbase extension...) work without one, so
 * we only register the WalletConnect connector when the id is present.
 *
 * IMPORTANT - RainbowKit wants a *grouped* wallet list:
 *
 *   [{ groupName: 'Recommended', wallets: [ ... ] }]
 *
 * A flat `[injectedWallet, ...]` array throws at module load:
 *   TypeError: Cannot read properties of undefined (reading 'length')
 * because each entry is destructured as `{ groupName, wallets }`. And the
 * entries must be the wallet *creators* (injectedWallet), never the result of
 * calling them (injectedWallet()) - RainbowKit supplies projectId/appName.
 */
const wallets: WalletList = [
  {
    groupName: 'Recommended',
    // Pass the wallet *creators*, not their return values: RainbowKit calls each
    // one itself with { projectId, appName, appIcon, ... }.
    wallets: [
      injectedWallet,
      coinbaseWallet,
      ...(projectId ? [walletConnectWallet] : []),
    ],
  },
];

const connectors = connectorsForWallets(wallets, {
  appName: 'VibeMusic',
  appDescription: 'Tip Audius artists in $VIBES on Base',
  projectId: projectId || 'vibemusic',
});

export const wagmiConfig = createConfig({
  connectors,
  chains: [base],
  transports: { [base.id]: http(rpcUrl) },
  ssr: true,
});
