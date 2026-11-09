#!/usr/bin/env node
/**
 * ONE-TIME activation: let the relayer pull tips out of the agent wallet.
 *
 *   npm run agent:activate
 *
 * Why this exists: $VIBES (Vibestarter) is a plain ERC-20 — it has no EIP-2612
 * `permit`, so an allowance has to be set with a real transaction. This single
 * `approve` is the only transaction the agent wallet ever sends. From then on
 * every tip is gasless for the agent: it signs EIP-712 authorizations and the
 * Cloudflare Worker pays the gas.
 *
 * The approve needs a tiny amount of ETH (~0.000003 ETH on Base, fractions of a
 * cent) — after that, the agent wallet needs $VIBES only.
 */
import { createPublicClient, createWalletClient, erc20Abi, formatUnits, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VIBES = '0xefFC8815487084a97edfdfF968b56Ea123421Acb';
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[38;5;48m${s}\x1b[0m`,
  red: (s) => `\x1b[38;5;203m${s}\x1b[0m`,
  yellow: (s) => `\x1b[38;5;221m${s}\x1b[0m`,
};

/* load env from agent/.env and .env.local */
for (const f of [resolve('agent/.env'), resolve('.env.local'), resolve('.env')]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const key = process.env.AGENT_PRIVATE_KEY;
const workerUrl = (process.env.WORKER_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787').replace(/\/$/, '');

if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) {
  console.error(c.red('\n  ✗ AGENT_PRIVATE_KEY missing. Run `npm run agent:wallet` first.\n'));
  process.exit(1);
}

const account = privateKeyToAccount(key);
const rpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const pub = createPublicClient({ chain: base, transport: http(rpc) });
const wallet = createWalletClient({ account, chain: base, transport: http(rpc) });

console.log('');
console.log(c.bold('  Activating the VibeMusic agent'));
console.log(c.dim(`  agent    ${account.address}`));

/* find the relayer address (the spender) */
let relayer;
try {
  const res = await fetch(`${workerUrl}/api/agent/state`);
  relayer = (await res.json()).relayerAddress;
} catch {
  console.log(c.yellow(`  ⚠ cannot reach the Worker at ${workerUrl}`));
}
if (!relayer) {
  relayer = process.env.RELAYER_ADDRESS;
}
if (!relayer || !/^0x[0-9a-fA-F]{40}$/.test(relayer)) {
  console.error(c.red('\n  ✗ could not resolve the relayer address.'));
  console.log(c.dim('    Start the worker (npm run dev:worker) or set RELAYER_ADDRESS manually.\n'));
  process.exit(1);
}
console.log(c.dim(`  relayer  ${relayer}`));

/* pre-flight */
const [eth, vibes, allowance] = await Promise.all([
  pub.getBalance({ address: account.address }),
  pub.readContract({ address: VIBES, abi: erc20Abi, functionName: 'balanceOf', args: [account.address] }),
  pub.readContract({ address: VIBES, abi: erc20Abi, functionName: 'allowance', args: [account.address, relayer] }),
]);

console.log(c.dim(`  balance  ${formatUnits(eth, 18)} ETH · ${formatUnits(vibes, 18)} $VIBES`));
console.log(c.dim(`  current allowance: ${formatUnits(allowance, 18)} $VIBES`));

if (allowance > 0n && allowance >= vibes / 2n) {
  console.log(c.green('\n  ✓ already activated — the relayer can tip on your behalf.\n'));
  process.exit(0);
}
if (vibes === 0n) {
  console.log(c.yellow('\n  ⚠ the agent wallet holds no $VIBES yet — fund it first, then re-run.'));
  console.log(c.dim('    https://basescan.org/token/' + VIBES + '?a=' + account.address + '\n'));
}
if (eth === 0n) {
  console.log(c.yellow('\n  ⚠ this wallet needs a dust of ETH *once* to send the approve transaction'));
  console.log(c.dim('    (about $0.001 on Base). After this single tx it never needs ETH again.'));
  console.log(c.dim('    Send ~0.00002 ETH to: ' + account.address + '\n'));
  process.exit(1);
}

/* approve a large allowance so tips stay gasless for a long time */
const MAX = 2n ** 200n;
console.log(c.dim('\n  sending approve...'));
try {
  const hash = await wallet.writeContract({
    address: VIBES,
    abi: erc20Abi,
    functionName: 'approve',
    args: [relayer, MAX],
  });
  console.log(c.dim(`  tx ${hash}`));
  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 60_000 });
  if (receipt.status !== 'success') throw new Error('approve reverted');
  console.log(c.green('\n  ✓ activated. The agent now tips without ever holding ETH.'));
  console.log(c.dim(`    https://basescan.org/tx/${hash}\n`));
} catch (e) {
  console.error(c.red(`\n  ✗ activation failed: ${e.shortMessage || e.message}\n`));
  process.exit(1);
}
