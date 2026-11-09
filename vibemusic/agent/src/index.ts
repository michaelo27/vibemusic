#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VibeMusic standalone agent
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the "true agentic payments" demo: a process that holds an agent key,
 * decides *on its own* what is worth tipping, signs an EIP-712 authorization and
 * posts it to the relayer. It never touches ETH and never sends a transaction —
 * the Cloudflare Worker verifies the signature and pays the gas.
 *
 * Usage:
 *   npm run start -- "Tip the best chill tracks right now"
 *   npm run start -- "find high-quality electronic tracks and tip the artists" --dry
 *
 * Env (see agent/.env.example):
 *   AGENT_PRIVATE_KEY   private key of the agent wallet (holds $VIBES only)
 *   WORKER_URL          https://vibemusic-relayer.<you>.workers.dev  (or localhost:8787)
 *   MIN_SCORE           optional, default 70
 *   MAX_TIPS            optional, default 2
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicClient, erc20Abi, formatUnits, http, parseUnits, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { TIP_TYPES, tipDomain, toTypedMessage } from '../../shared/eip712';
import { MISSION_PRESETS, formatCount, parseIntent, scoreTrack, selectTracks } from '../../shared/scoring';
import { searchTracks, trendingTracks } from '../../shared/audius';
import type { AudiusTrack, TipJar, TipAuthorization } from '../../shared/types';

const HERE = dirname(fileURLToPath(import.meta.url));
const VIBES = '0xefFC8815487084a97edfdfF968b56Ea123421Acb' as const;
const CHAIN_ID = 8453;

/* ── tiny .env loader (no deps) ──────────────────────────────────────────── */
function loadEnv() {
  for (const file of [resolve(HERE, '../.env'), resolve(HERE, '../../.env'), resolve(HERE, '../.env.local')]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
}
loadEnv();

/* ── pretty CLI ──────────────────────────────────────────────────────────── */
const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  green: (s: string) => `\x1b[38;5;48m${s}\x1b[0m`,
  purple: (s: string) => `\x1b[38;5;141m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[38;5;221m${s}\x1b[0m`,
  red: (s: string) => `\x1b[38;5;203m${s}\x1b[0m`,
};
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const prompt =
    args.filter((a) => !a.startsWith('--')).join(' ').trim() ||
    MISSION_PRESETS[0].prompt;

  const key = process.env.AGENT_PRIVATE_KEY;
  const workerUrl = (process.env.WORKER_URL || 'http://localhost:8787').replace(/\/$/, '');
  const minScore = Number(process.env.MIN_SCORE || 70);
  const maxTips = Number(process.env.MAX_TIPS || 2);

  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) {
    log(c.red('✗ AGENT_PRIVATE_KEY missing.'));
    log(c.dim('  cp agent/.env.example agent/.env and paste your agent wallet key.'));
    log(c.dim('  Create one with: npm run agent:wallet (from the repo root)'));
    process.exit(1);
  }

  const account = privateKeyToAccount(key as Hex);
  const pub = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org') });

  log('');
  log(c.bold('  VibeMusic agent') + c.dim(`  ·  ${prompt}`));
  log(c.dim(`  wallet  ${account.address}`));

  /* ── balances ─────────────────────────────────────────────────────────── */
  const [vibes, eth] = await Promise.all([
    pub.readContract({ address: VIBES, abi: erc20Abi, functionName: 'balanceOf', args: [account.address] }).catch(() => 0n),
    pub.getBalance({ address: account.address }).catch(() => 0n),
  ]);
  log(
    c.dim('  holds   ') +
      c.green(`${formatUnits(vibes as bigint, 18)} $VIBES`) +
      c.dim(`  ·  ${formatUnits(eth as bigint, 18)} ETH (we never need this)`),
  );
  if ((vibes as bigint) === 0n && !dry) {
    log(c.yellow('  ⚠ wallet has no $VIBES — fund it first, or run with --dry to preview only.'));
  }

  /* ── discover ─────────────────────────────────────────────────────────── */
  const intent = parseIntent(prompt);
  log('');
  log(c.dim(`  ▸ intent  ${intent.brief}`));

  const query = intent.genres[0] ?? prompt.split(/\s+/).slice(0, 3).join(' ');
  const [trending, search] = await Promise.all([
    trendingTracks(10).catch(() => [] as AudiusTrack[]),
    query ? searchTracks(query, 6).catch(() => [] as AudiusTrack[]) : Promise.resolve([] as AudiusTrack[]),
  ]);
  const seen = new Set<string>();
  const candidates = [...trending, ...search].filter((t) => t?.id && !seen.has(t.id) && seen.add(t.id));
  log(c.dim(`  ▸ scanned ${candidates.length} Audius tracks`));

  /* ── judge ────────────────────────────────────────────────────────────── */
  const scored = candidates.map((t) => scoreTrack(t, intent, { missionSeed: String(Date.now()) }));
  const { selected } = selectTracks(scored, { limit: maxTips, minScore });
  log(c.dim(`  ▸ ${selected.length} cleared the ${minScore}/100 bar`));
  if (!selected.length) {
    const top = scored.sort((a, b) => b.score - a.score)[0];
    log(c.yellow(`  ⚠ nothing good enough. best: ${top?.track.title} (${top?.score})`));
    return;
  }

  /* ── match jars (from the Worker's KV index) ──────────────────────────── */
  let jars: TipJar[] = [];
  try {
    const res = await fetch(`${workerUrl}/api/jars`);
    jars = ((await res.json()) as { jars: TipJar[] }).jars ?? [];
  } catch {
    log(c.red(`  ✗ cannot reach the relayer at ${workerUrl}`));
    return;
  }
  const byHandle = new Map<string, TipJar>();
  for (const jar of jars) for (const h of jar.audiusHandles ?? []) byHandle.set(h.toLowerCase(), jar);
  log(c.dim(`  ▸ ${jars.length} tip jars indexed for matching`));

  /* ── sign + relay ─────────────────────────────────────────────────────── */
  let tipped = 0;
  let volume = 0;

  for (const s of selected) {
    const t = s.track;
    const jar = byHandle.get((t.artistHandle || '').toLowerCase());
    log('');
    log(`  ${c.purple('◆')} ${c.bold(t.title)} ${c.dim(`— @${t.artistHandle}`)}`);
    log(c.dim(`    score ${s.score}/100 · ${formatCount(t.playCount)} plays · ${t.genre ?? 'n/a'}`));
    log(c.dim(`    why: ${s.reason}`));

    if (!jar) {
      log(c.yellow('    ⚠ skipped — this artist has no VibeMusic jar yet'));
      continue;
    }

    const amount = Math.min(s.suggestedAmount, Number(process.env.MAX_TIP_AMOUNT || 100));
    const amountWei = parseUnits(String(amount), 18);

    const auth: TipAuthorization = {
      from: account.address,
      to: jar.wallet as `0x${string}`,
      amount: amountWei.toString(),
      nonce: String(Date.now()) + Math.floor(Math.random() * 1000),
      deadline: String(Math.floor(Date.now() / 1000) + 600),
      missionId: `cli_${Date.now().toString(36)}`,
      reason: s.reason.slice(0, 300),
      trackId: t.id,
    };

    const signature = await account.signTypedData({
      domain: tipDomain(CHAIN_ID),
      types: TIP_TYPES,
      primaryType: 'TipAuthorization',
      message: toTypedMessage(auth),
    });

    if (dry) {
      log(c.dim(`    (dry) would sign & relay ${amount} $VIBES → ${jar.wallet}`));
      continue;
    }

    log(c.dim(`    signing EIP-712 · relaying ${amount} $VIBES → @${jar.slug} …`));
    try {
      const res = await fetch(`${workerUrl}/api/agent/tip`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ authorization: auth, signature, trackTitle: t.title, artist: t.artist }),
      });
      const data: any = await res.json();
      if (!res.ok) {
        log(c.red(`    ✗ relayer refused (${data.code ?? res.status}): ${data.error}`));
        if (data.code === 'NEEDS_APPROVAL') {
          log(c.dim('      run `npm run agent:activate` once to approve the relayer.'));
        }
        if (data.code === 'INSUFFICIENT_VIBES') {
          log(c.dim('      fund the agent wallet with $VIBES on Base.'));
        }
        continue;
      }
      tipped += 1;
      volume += amount;
      log(c.green(`    ✓ settled ${amount} $VIBES`) + c.dim(`  tx ${data.tip.txHash}`));
      log(c.dim(`      https://basescan.org/tx/${data.tip.txHash}`));
    } catch (e) {
      log(c.red(`    ✗ relay failed: ${e instanceof Error ? e.message : String(e)}`));
    }
  }

  log('');
  log(
    tipped
      ? c.green(`  ✓ mission complete · ${tipped} tip${tipped === 1 ? '' : 's'} · ${volume} $VIBES · 0 ETH spent`)
      : c.yellow('  · mission complete · nothing tipped'),
  );
  log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
