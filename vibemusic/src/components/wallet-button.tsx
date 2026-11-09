'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChevronDown, Wallet } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ERC20_ABI, VIBES_TOKEN, fromWei } from '@/lib/vibes';
import { cn } from '@/lib/utils';

/** Connected-wallet pill that also shows the user's $VIBES balance. */
export function WalletButton({ className }: { className?: string }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            className={cn('flex items-center', className)}
            {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}
          >
            {!connected ? (
              <Button variant="accent" size="md" onClick={openConnectModal} className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect wallet
              </Button>
            ) : chain.unsupported ? (
              <Button variant="danger" size="md" onClick={openChainModal}>
                Switch to Base
              </Button>
            ) : (
              <button
                onClick={openAccountModal}
                className="group flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.05] py-1.5 pl-1.5 pr-3 text-sm transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                {account.ensAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={account.ensAvatar} alt="" className="h-6 w-6 rounded-lg" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-vibe-400/70 to-aura-500/70 text-[10px] font-bold text-ink-950">
                    {account.address.slice(2, 4).toUpperCase()}
                  </span>
                )}
                <span className="font-medium text-white/85">{account.displayName}</span>
                <VibesBalance address={account.address} />
                <ChevronDown className="h-3.5 w-3.5 text-white/30 transition group-hover:text-white/60" />
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

function VibesBalance({ address }: { address: string }) {
  const { data } = useReadContract({
    address: VIBES_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { refetchInterval: 20_000 },
  });

  if (data === undefined) return null;
  return (
    <span className="num hidden rounded-md bg-black/40 px-1.5 py-0.5 text-[11px] text-vibe-200/90 sm:inline">
      {fromWei(data as bigint)} VIBES
    </span>
  );
}

/** True when the visitor is on Base with a wallet connected. */
export function useBaseAccount() {
  const { address, isConnected } = useAccount();
  return { address, isConnected };
}
