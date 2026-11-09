#!/usr/bin/env node
/**
 * Create a fresh agent wallet (or print the one you already have).
 *
 *   npm run agent:wallet
 *
 * Writes AGENT_PRIVATE_KEY into agent/.env (created if missing) and prints the
 * address to fund with $VIBES. The agent wallet only ever needs $VIBES.
 */
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV = resolve(process.cwd(), 'agent/.env');
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[38;5;48m${s}\x1b[0m`,
  yellow: (s) => `\x1b[38;5;221m${s}\x1b[0m`,
};

let existing = '';
if (existsSync(ENV)) {
  const match = readFileSync(ENV, 'utf8').match(/^AGENT_PRIVATE_KEY=(.+)$/m);
  if (match) existing = match[1].trim();
}

const key = existing && /^0x[0-9a-fA-F]{64}$/.test(existing) ? existing : generatePrivateKey();
const account = privateKeyToAccount(key);

if (!existing) {
  const body = existsSync(ENV)
    ? readFileSync(ENV, 'utf8')
    : '# VibeMusic agent env — DO NOT COMMIT\n# agent wallet: holds $VIBES only, never needs ETH\nWORKER_URL=http://localhost:8787\n';
  const next = /^AGENT_PRIVATE_KEY=/m.test(body)
    ? body.replace(/^AGENT_PRIVATE_KEY=.*$/m, `AGENT_PRIVATE_KEY=${key}`)
    : `${body.trimEnd()}\nAGENT_PRIVATE_KEY=${key}\n`;
  writeFileSync(ENV, next);
}

console.log('');
console.log(`  ${c.bold('Agent wallet')}`);
console.log(`  address  ${c.green(account.address)}`);
console.log(`  key      ${c.dim(existing ? '(already in agent/.env)' : 'written to agent/.env')}`);
console.log('');
console.log(`  ${c.bold('Next steps')}`);
console.log(`  ${c.dim('1.')} Fund it with $VIBES on Base:`);
console.log(`     ${c.dim('https://basescan.org/token/0xefFC8815487084a97edfdfF968b56Ea123421Acb?a=' + account.address)}`);
console.log(`  ${c.dim('2.')} Approve the relayer once so it can pull tips:`);
console.log(`     ${c.green('npm run agent:activate')} ${c.dim('— the only agent transaction ever (needs ~$0.001 of ETH once)')}`);
console.log(`  ${c.dim('3.')} Check everything:`);
console.log(`     ${c.green('npm run agent:status')}`);
console.log('');
console.log(c.yellow('  ⚠ Keep agent/.env secret — it is already in .gitignore.'));
console.log('');
