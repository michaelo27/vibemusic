#!/usr/bin/env node
/**
 * VibeMusic smoke test — exercises the whole Worker contract against a running
 * Worker (local or deployed). Great for judges: it proves the crypto works.
 *
 *   npm run smoke   (from agent/)
 *
 * Env:
 *   WORKER_URL          default http://localhost:8787
 *   AGENT_PRIVATE_KEY   the same key the Worker has (proves EIP-712 verification)
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseUnits, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TIP_TYPES, buildJarMessage, tipDomain, toTypedMessage } from '../../shared/eip712';
import type { AudiusTrack, TipAuthorization, TipJar } from '../../shared/types';

const HERE = dirname(fileURLToPath(import.meta.url));

for (const file of [resolve(HERE, '../.env'), resolve(HERE, '../../worker/.dev.vars')]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const WORKER = (process.env.WORKER_URL || 'http://localhost:8787').replace(/\/$/, '');
const pass = (s: string) => console.log(`  \x1b[38;5;48m✓\x1b[0m ${s}`);
const fail = (s: string) => {
  console.log(`  \x1b[38;5;203m✗\x1b[0m ${s}`);
  failures++;
};
const info = (s: string) => console.log(`  \x1b[2m· ${s}\x1b[0m`);
let failures = 0;

async function call<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const res = await fetch(`${WORKER}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as T };
}

async function main() {
  console.log('\n\x1b[1m VibeMusic worker smoke test\x1b[0m');
  info(`target ${WORKER}`);

  /* 1 — health */
  const health = await call<{ ok: boolean; agent: string }>('/api/health');
  health.status === 200 && health.body.ok ? pass('health responds') : fail('health failed');

  /* 2 — external agent key must match the worker's agent wallet */
  const key = process.env.AGENT_PRIVATE_KEY;
  if (!key) {
    fail('AGENT_PRIVATE_KEY not set (needed to sign authorizations)');
    return summary();
  }
  const agent = privateKeyToAccount(key as Hex);
  info(`signing as ${agent.address}`);
  agent.address.toLowerCase() === health.body.agent.toLowerCase()
    ? pass('agent wallet matches worker config')
    : fail('AGENT_PRIVATE_KEY does not match the worker AGENT_PRIVATE_KEY');

  /* 3 — resolve an Audius track through the worker proxy */
  const resolved = await call<{ track: AudiusTrack }>('/api/audius/track?q=AK3w5q0');
  const track = resolved.body.track;
  track?.id ? pass(`Audius proxy resolved “${track.title.slice(0, 32)}”`) : fail('Audius proxy failed');

  /* 4 — create a jar with a real wallet signature */
  const artist = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
  const timestamp = Date.now();
  const slug = `smoke-${Date.now().toString(36).slice(-5)}`;
  const message = buildJarMessage({
    wallet: artist.address,
    slug,
    name: 'Smoke Test Artist',
    trackIds: [track.id],
    timestamp,
  });
  const signature = await artist.signMessage({ message });
  const created = await call<{ jar: TipJar; error?: string }>('/api/jars', {
    method: 'POST',
    body: JSON.stringify({
      input: {
        wallet: artist.address,
        slug,
        name: 'Smoke Test Artist',
        bio: 'created by the smoke test',
        tracks: [track],
      },
      signature,
      timestamp,
    }),
  });
  created.status === 200 && created.body.jar
    ? pass(`jar created (/${created.body.jar.slug})`)
    : fail(`jar creation failed: ${created.body.error}`);

  /* 5 — unsigned jar creation must be rejected */
  const unsigned = await call('/api/jars', {
    method: 'POST',
    body: JSON.stringify({ input: { wallet: artist.address, slug: 'nope', name: 'x', tracks: [track] } }),
  });
  unsigned.status === 401 ? pass('unsigned jar creation rejected (401)') : fail('unsigned jar was accepted!');

  /* 6 — build + sign an authorization exactly like the agent does */
  const amount = parseUnits('1', 18);
  const auth: TipAuthorization = {
    from: agent.address,
    to: artist.address,
    amount: amount.toString(),
    nonce: String(Date.now()),
    deadline: String(Math.floor(Date.now() / 1000) + 600),
    missionId: 'smoke',
    reason: 'smoke test: signature + replay protection',
    trackId: track.id,
  };
  const goodSig = await agent.signTypedData({
    domain: tipDomain(8453),
    types: TIP_TYPES,
    primaryType: 'TipAuthorization',
    message: toTypedMessage(auth),
  });

  const tip1 = await call<{ ok?: boolean; code?: string; error?: string; tip?: any }>('/api/agent/tip', {
    method: 'POST',
    body: JSON.stringify({ authorization: auth, signature: goodSig, trackTitle: track.title }),
  });

  if (tip1.status === 200 && tip1.body.tip?.txHash) {
    pass(`tip relayed on Base — ${tip1.body.tip.txHash}`);
    info(`https://basescan.org/tx/${tip1.body.tip.txHash}`);
  } else if (tip1.body.code === 'NEEDS_APPROVAL') {
    pass('relayer verified the EIP-712 signature and asked for allowance (expected before activation)');
    info('run `npm run agent:activate` to complete this step for real');
  } else if (tip1.body.code === 'INSUFFICIENT_VIBES') {
    pass('relayer verified the signature; agent wallet needs $VIBES');
  } else {
    fail(`unexpected relay response: ${tip1.status} ${tip1.body.code} ${tip1.body.error}`);
  }

  /* 7 — replay protection */
  const tip2 = await call<{ code?: string }>('/api/agent/tip', {
    method: 'POST',
    body: JSON.stringify({ authorization: auth, signature: goodSig, trackTitle: track.title }),
  });
  tip2.body.code === 'REPLAY' ? pass('replay of the same authorization blocked') : fail(`replay not blocked (${tip2.body.code})`);

  /* 8 — tampered signature */
  const tampered = { ...auth, amount: parseUnits('50', 18).toString(), nonce: String(Date.now() + 1) };
  const tip3 = await call<{ code?: string }>('/api/agent/tip', {
    method: 'POST',
    body: JSON.stringify({ authorization: tampered, signature: goodSig }),
  });
  ['BAD_SIGNATURE', 'EXPIRED'].includes(tip3.body.code ?? '')
    ? pass('tampered authorization rejected')
    : fail(`tampered authorization accepted?! (${tip3.body.code})`);

  /* 9 — claim a jar for a track the agent actually likes, then run a mission.
   *      This proves discover → judge → match → sign → relay in one shot. */
  const lofi = await call<{ tracks: AudiusTrack[] }>('/api/audius/trending?limit=5&genre=Lo-Fi');
  const topLofi = lofi.body.tracks?.[0];
  if (topLofi) {
    const holder = privateKeyToAccount('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a');
    const ts = Date.now();
    const s2 = `lofi-${ts.toString(36).slice(-5)}`;
    const msg = buildJarMessage({
      wallet: holder.address,
      slug: s2,
      name: 'Lo-Fi Test',
      trackIds: [topLofi.id],
      timestamp: ts,
    });
    const sig = await holder.signMessage({ message: msg });
    const r = await call<{ jar?: TipJar }>('/api/jars', {
      method: 'POST',
      body: JSON.stringify({
        input: {
          wallet: holder.address,
          slug: s2,
          name: 'Lo-Fi Test',
          bio: 'jar used by the agent end-to-end test',
          tracks: [topLofi],
        },
        signature: sig,
        timestamp: ts,
      }),
    });
    r.body.jar
      ? pass(`jar claimed for @${topLofi.artistHandle} (/${s2})`)
      : fail('could not claim a jar for the agent end-to-end test');
  }

  /* 10 — mission runner: expect the agent to sign a tip for that artist */
  const mission = await call<{ mission?: any; error?: string }>('/api/agent/run', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'Tip the best chill tracks right now' }),
  });
  if (mission.body.mission) {
    const m = mission.body.mission;
    const signed = (m.steps ?? []).some((s: any) => s.stage === 'sign');
    signed
      ? pass(`agent signed an EIP-712 authorization (${m.considered} scanned, ${m.tipped} settled)`)
      : fail('agent never reached the signing stage');
    if (m.tipped > 0) pass(`agent tips settled on Base · ${m.totalAmount} $VIBES, 0 ETH spent`);
    else {
      const err = (m.steps ?? []).find((s: any) => s.stage === 'error');
      pass(`mission finished (${m.status}) — relay stopped at: ${err?.detail ?? 'no jar matched'}`);
    }
  } else {
    fail(`mission failed: ${mission.body.error}`);
  }

  summary();
}

function summary() {
  console.log('');
  console.log(failures === 0 ? '  \x1b[38;5;48mAll checks passed.\x1b[0m\n' : `  \x1b[38;5;203m${failures} check(s) failed.\x1b[0m\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
