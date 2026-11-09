#!/usr/bin/env node
/**
 * Print the agent's live status: wallet, $VIBES balance, relayer allowance and
 * the relayer's gas tank. Reads from the Worker (/api/agent/state) so it always
 * reflects on-chain truth.
 *
 *   npm run agent:status
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

for (const f of [resolve('agent/.env'), resolve('.env.local'), resolve('.env')]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const workerUrl = (process.env.WORKER_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787').replace(/\/$/, '');
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[38;5;48m${s}\x1b[0m`,
  red: (s) => `\x1b[38;5;203m${s}\x1b[0m`,
  yellow: (s) => `\x1b[38;5;221m${s}\x1b[0m`,
};

try {
  const [state, health] = await Promise.all([
    fetch(`${workerUrl}/api/agent/state`).then((r) => r.json()),
    fetch(`${workerUrl}/api/health`).then((r) => r.json()),
  ]);

  const ok = (b) => (b ? c.green('yes') : c.red('no'));

  console.log('');
  console.log(`  ${c.bold('VibeMusic agent status')} ${c.dim(workerUrl)}`);
  console.log(`  ${c.dim('─'.repeat(58))}`);
  console.log(`  agent wallet       ${state.agentAddress}`);
  console.log(`  $VIBES balance     ${c.green(state.vibesBalance)}`);
  console.log(`  relayer            ${state.relayerAddress}`);
  console.log(`  relayer ETH        ${state.relayerEthBalance} ${c.dim('(pays all gas)')}`);
  console.log(`  allowance granted  ${state.allowance} ${c.dim(`— activated: ${ok(state.approved)}`)}`);
  console.log(`  tips today         ${state.tipsToday ?? 0} ${c.dim(`(${state.spendToday ?? 0} $VIBES)`)}`);
  console.log(`  caps               ${state.maxTipAmount} $VIBES/tip · ${health.limits?.dailySpendCap}/day · min score ${health.limits?.minScore}`);
  console.log(`  ${c.dim('─'.repeat(58))}`);

  if (!state.approved) console.log(c.yellow('  ⚠ not activated yet → run `npm run agent:activate`'));
  if (Number(state.vibesBalance) === 0) console.log(c.yellow('  ⚠ agent wallet is empty → fund it with $VIBES on Base'));
  if (Number(state.relayerEthBalance) === 0) console.log(c.yellow('  ⚠ relayer gas tank empty → fund it with a little ETH'));
  console.log('');
} catch (e) {
  console.error(c.red(`\n  ✗ cannot reach the Worker at ${workerUrl} — is it running? (npm run dev:worker)\n`));
  process.exit(1);
}
