/** $VIBES on Base — constants shared by the UI. */
import { formatUnits, parseUnits, isAddress } from 'viem';

export const VIBES_TOKEN = '0xefFC8815487084a97edfdfF968b56Ea123421Acb' as const;
export const VIBES_SYMBOL = 'VIBES';
export const VIBES_DECIMALS = 18;
export const BASE_CHAIN_ID = 8453;
export const BASESCAN = 'https://basescan.org';

/** Minimal ERC-20 surface we need (plain ERC-20: no permit on this token). */
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export const TIP_PRESETS = ['10', '25', '50', '100'] as const;

export function toWei(amount: string): bigint {
  try {
    return parseUnits(String(amount || '0'), VIBES_DECIMALS);
  } catch {
    return 0n;
  }
}

/** Pretty-format a wei string for display: 125000000000000000000 → "125" */
export function fromWei(wei: string | bigint | undefined | null): string {
  if (wei === undefined || wei === null) return '0';
  try {
    const v = formatUnits(BigInt(wei), VIBES_DECIMALS);
    const n = Number(v);
    if (!Number.isFinite(n)) return v;
    if (n === 0) return '0';
    if (n < 0.01) return '<0.01';
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } catch {
    return '0';
  }
}

export function isAddr(v?: string | null): v is `0x${string}` {
  return !!v && isAddress(v);
}

export const txUrl = (hash?: string | null) => (hash ? `${BASESCAN}/tx/${hash}` : undefined);
export const addressUrl = (addr?: string | null) => (addr ? `${BASESCAN}/address/${addr}` : undefined);
