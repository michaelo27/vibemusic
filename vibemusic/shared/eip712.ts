/**
 * Agentic payment authorization (EIP-712) — shared by the agent runtime and the
 * Cloudflare Worker that verifies + relays it.
 *
 * The agent NEVER needs ETH: it only signs this struct off-chain. The Worker
 * (relayer) verifies the signature, then submits the on-chain `transferFrom`
 * and pays the gas itself.
 */
import type { TipAuthorization } from './types';

export const TIP_DOMAIN_NAME = 'VibeMusic';
export const TIP_DOMAIN_VERSION = '1';

export type TipDomain = {
  name: string;
  version: string;
  chainId: number;
};

export function tipDomain(chainId = 8453): TipDomain {
  return { name: TIP_DOMAIN_NAME, version: TIP_DOMAIN_VERSION, chainId };
}

export const TIP_TYPES = {
  TipAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'missionId', type: 'string' },
    { name: 'reason', type: 'string' },
    { name: 'trackId', type: 'string' },
  ],
} as const;

/** JSON-safe authorization → the exact object viem hashes (bigints for uints). */
export function toTypedMessage(auth: TipAuthorization) {
  return {
    from: auth.from,
    to: auth.to,
    amount: BigInt(auth.amount),
    nonce: BigInt(auth.nonce),
    deadline: BigInt(auth.deadline),
    missionId: auth.missionId,
    reason: auth.reason,
    trackId: auth.trackId,
  };
}

/**
 * Plain-text login message used to prove a human owns the wallet that creates
 * or edits a Tip Jar (EIP-191 personal_sign — supported by every wallet).
 */
export function buildJarMessage(params: {
  wallet: string;
  slug: string;
  name: string;
  trackIds: string[];
  timestamp: number;
}): string {
  const { wallet, slug, name, trackIds, timestamp } = params;
  return [
    'VibeMusic · create tip jar',
    '',
    `Wallet: ${wallet.toLowerCase()}`,
    `Handle: @${slug}`,
    `Name: ${name}`,
    `Tracks: ${trackIds.join(', ') || '(none)'}`,
    `Issued: ${timestamp}`,
    '',
    'Signing this proves you control this wallet. No gas, no transaction.',
  ].join('\n');
}

/** Basic shape validation shared by Worker + agent (keeps RPC calls honest). */
export function isValidAuthorization(auth: Partial<TipAuthorization> | undefined | null): auth is TipAuthorization {
  if (!auth) return false;
  const addr = /^0x[0-9a-fA-F]{40}$/;
  if (!addr.test(auth.from ?? '') || !addr.test(auth.to ?? '')) return false;
  if (!/^\d+$/.test(String(auth.amount ?? ''))) return false;
  if (!/^\d+$/.test(String(auth.nonce ?? ''))) return false;
  if (!/^\d+$/.test(String(auth.deadline ?? ''))) return false;
  if (typeof auth.missionId !== 'string' || typeof auth.reason !== 'string') return false;
  if (typeof auth.trackId !== 'string') return false;
  if (auth.reason.length > 400) return false;
  return true;
}
