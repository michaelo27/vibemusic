'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ArrowUpRight, Check, Coins, Heart, Loader2, Sparkles, Zap } from 'lucide-react';
import * as React from 'react';
import { useAccount, useConfig, useReadContract } from 'wagmi';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { api, IS_DEMO } from '@/lib/api';
import type { Tip, TipJar } from '@/lib/types';
import { cn, shortAddress } from '@/lib/utils';
import { BASE_CHAIN_ID, ERC20_ABI, TIP_PRESETS, VIBES_TOKEN, fromWei, toWei, txUrl } from '@/lib/vibes';

type Phase = 'idle' | 'signing' | 'confirming' | 'recording' | 'done';

/**
 * Human tipping: a direct ERC-20 transfer from the fan's wallet to the artist.
 * No contract, no custody, no fees beyond Base gas (~$0.001).
 */
export function TipPanel({ jar, onTipped }: { jar: TipJar; onTipped?: (tip: Tip) => void }) {
  const { address, isConnected, chainId } = useAccount();
  const config = useConfig();
  const { openConnectModal } = useConnectModal();
  const { toast } = useToast();

  const [amount, setAmount] = React.useState<string>('25');
  const [custom, setCustom] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [lastTx, setLastTx] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const usingCustom = custom.trim().length > 0;
  const finalAmount = usingCustom ? custom.trim() : amount;
  const numeric = Number(finalAmount);
  const valid = Number.isFinite(numeric) && numeric > 0 && numeric <= 1_000_000;

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: VIBES_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !IS_DEMO, refetchInterval: 15_000 },
  });

  const busy = phase !== 'idle' && phase !== 'done';
  const insufficient = !IS_DEMO && balance !== undefined && numeric > 0 && toWei(finalAmount) > (balance as bigint);

  async function handleTip() {
    if (!valid || busy) return;
    setError(null);
    setLastTx(null);

    // ── DEMO MODE: no chain writes at all ────────────────────────────────
    if (IS_DEMO) {
      setPhase('signing');
      await new Promise((r) => setTimeout(r, 500));
      setPhase('confirming');
      await new Promise((r) => setTimeout(r, 900));
      setPhase('recording');
      const tip = await api.recordTip({
        to: jar.wallet,
        amount: finalAmount,
        message: message.trim() || null,
        from: address ?? null,
      });
      setPhase('done');
      setLastTx(tip.txHash ?? null);
      setMessage('');
      onTipped?.(tip);
      toast({
        title: `Tipped ${finalAmount} VIBES (demo)`,
        description: 'Demo mode — nothing was sent on-chain. Deploy the Worker to tip for real.',
        tone: 'success',
      });
      return;
    }

    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }

    try {
      if (chainId !== BASE_CHAIN_ID) {
        toast({ title: 'Switch to Base', description: 'VibeMusic tips settle on Base mainnet.', tone: 'error' });
        return;
      }

      setPhase('signing');
      const hash = await writeContract(config, {
        address: VIBES_TOKEN,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [jar.wallet as `0x${string}`, toWei(finalAmount)],
        chainId: BASE_CHAIN_ID,
      });

      setPhase('confirming');
      await waitForTransactionReceipt(config, { hash, confirmations: 1 });

      setPhase('recording');
      const tip = await api.recordTip({
        txHash: hash,
        to: jar.wallet,
        amount: finalAmount,
        message: message.trim() || null,
        from: address,
      });

      setPhase('done');
      setLastTx(hash);
      setMessage('');
      void refetchBalance();
      onTipped?.(tip);
      toast({
        title: `Tipped ${finalAmount} $VIBES`,
        description: `Sent to ${jar.name} on Base. Thank you for supporting the artist.`,
        tone: 'success',
      });
    } catch (e: any) {
      const msg = String(e?.shortMessage || e?.message || e);
      const friendly = /insufficient funds/i.test(msg)
        ? 'You need a little ETH on Base for gas. (Only the agent gets sponsored gas.)'
        : /user rejected|denied/i.test(msg)
          ? 'Transaction rejected in your wallet.'
          : msg.slice(0, 180);
      setError(friendly);
      setPhase('idle');
      toast({ title: 'Tip failed', description: friendly, tone: 'error' });
    }
  }

  // reset the success state when the user starts picking a new amount
  React.useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => setPhase('idle'), 6000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-1">
      <div className="rounded-[20px] bg-ink-950/50 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/40">
            <Heart className="h-3.5 w-3.5 text-vibe-300" /> tip {jar.name}
          </h3>
          {IS_DEMO ? (
            <span className="chip">demo</span>
          ) : balance !== undefined ? (
            <span className="num text-[11px] text-white/35">you hold {fromWei(balance as bigint)} VIBES</span>
          ) : null}
        </div>

        {/* amount picker */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {TIP_PRESETS.map((p) => {
            const active = !usingCustom && amount === p;
            return (
              <button
                key={p}
                onClick={() => {
                  setAmount(p);
                  setCustom('');
                }}
                disabled={busy}
                className={cn(
                  'num rounded-xl border py-2.5 text-[13px] font-semibold transition-all disabled:opacity-40',
                  active
                    ? 'border-vibe-400/60 bg-vibe-400/15 text-vibe-100 shadow-[0_0_0_1px_rgba(87,247,182,0.25),0_10px_30px_-16px_rgba(43,231,155,0.8)]'
                    : 'border-white/[0.07] bg-white/[0.025] text-white/55 hover:border-white/20 hover:text-white/85',
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="custom amount"
              inputMode="decimal"
              disabled={busy}
              className="field h-10 pl-3 pr-14 text-[13px]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-white/30">
              VIBES
            </span>
          </div>
          <div className="flex h-10 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] px-2.5 text-[11px] text-white/35">
            <Zap className="h-3 w-3 text-vibe-300/70" />
            Base
          </div>
        </div>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 180))}
          placeholder="Leave a short message (optional)"
          className="mt-1.5 min-h-[64px] text-[13px]"
          disabled={busy}
        />

        <Button
          variant="accent"
          size="lg"
          className="mt-2.5 w-full"
          onClick={handleTip}
          loading={busy}
          disabled={!valid || insufficient}
        >
          {phase === 'signing' && 'Confirm in wallet…'}
          {phase === 'confirming' && 'Waiting for Base…'}
          {phase === 'recording' && 'Logging the tip…'}
          {phase === 'done' && (
            <>
              <Check className="h-4 w-4" /> Tip sent
            </>
          )}
          {phase === 'idle' &&
            (isConnected || IS_DEMO
              ? `Tip ${valid ? Number(finalAmount).toLocaleString() : '—'} $VIBES`
              : 'Connect wallet to tip')}
        </Button>

        {insufficient && (
          <p className="mt-2 text-center text-[11px] text-amber-200/80">
            Not enough $VIBES in this wallet — get some on Base, or ask the agent to tip for you.
          </p>
        )}
        {error && <p className="mt-2 text-center text-[11px] text-red-300/90">{error}</p>}

        {phase === 'done' && lastTx && (
          <a
            href={txUrl(lastTx)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex animate-fade-in items-center justify-center gap-1 text-[11px] text-vibe-300/80 hover:text-vibe-200"
          >
            <Sparkles className="h-3 w-3" /> {shortAddress(lastTx, 6)} on BaseScan <ArrowUpRight className="h-3 w-3" />
          </a>
        )}

        <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-2.5 text-[10.5px] leading-relaxed text-white/25">
          <Coins className="h-3 w-3 shrink-0 text-white/20" />
          <p>
            Straight from your wallet to the artist&apos;s wallet — no custody, no platform fee. You pay ~$0.001 of Base
            gas.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TipPanelSkeleton() {
  return (
    <div className="flex h-72 items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02]">
      <Loader2 className="h-4 w-4 animate-spin text-white/30" />
    </div>
  );
}
