/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The VibeMusic agent runtime.
 * ─────────────────────────────────────────────────────────────────────────────
 * A mission is a plain-English instruction. The agent:
 *   1. discovers candidates on Audius (trending + search)
 *   2. scores them with deterministic, explainable rules (shared/scoring.ts)
 *   3. keeps only tracks whose artist claimed a VibeMusic jar
 *   4. signs an EIP-712 TipAuthorization (no gas, no ETH)
 *   5. hands it to the relayer, which verifies and pays the gas
 *   6. writes a permanent, auditable mission log to KV
 */
import { parseUnits, type Hex } from 'viem';
import { searchTracks, trendingTracks } from '../../shared/audius';
import { TIP_TYPES, isValidAuthorization, tipDomain, toTypedMessage } from '../../shared/eip712';
import { parseIntent, scoreTrack, selectTracks } from '../../shared/scoring';
import type { AgentMission, AgentStep, AudiusTrack, Tip, TipAuthorization } from '../../shared/types';
import {
  addDailySpend,
  claimNonce,
  findJar,
  getDailySpend,
  getJar,
  recentTips,
  recordTip,
  saveMission,
  walletForHandle,
} from './store';
import { CHAIN_ID, VIBES_DECIMALS, config, type Env } from './env';
import { agentAccount, agentAddress, fromWei, relayTip, verifyTipAuthorization } from './chain';
import { ApiError } from './http';

const nowSec = () => Math.floor(Date.now() / 1000);
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* ═══════════════════════════════════════════════════════════════════════════
 * Submit one signed authorization (used by the mission runner AND the public
 * /api/agent/tip endpoint that any external agent can call).
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function submitTip(
  env: Env,
  input: {
    authorization: TipAuthorization;
    signature: Hex;
    trackTitle?: string | null;
    artist?: string | null;
    /** trust the caller-supplied reason? only for mission-generated auths */
    skipJarCheck?: boolean;
  },
): Promise<Tip> {
  const cfg = config(env);
  const { authorization: auth, signature } = input;

  if (!isValidAuthorization(auth)) throw new ApiError('Malformed tip authorization', 400, 'BAD_AUTH');

  const deadline = Number(auth.deadline);
  if (!Number.isFinite(deadline) || deadline < nowSec()) {
    throw new ApiError('Authorization expired — sign a fresh one', 400, 'EXPIRED');
  }
  if (deadline > nowSec() + 3600) {
    throw new ApiError('Authorization deadline is too far in the future (max 1h)', 400, 'DEADLINE_TOO_FAR');
  }

  const amountWei = BigInt(auth.amount);
  if (amountWei <= 0n) throw new ApiError('Amount must be positive', 400, 'BAD_AMOUNT');

  const maxWei = parseUnits(String(cfg.maxTipAmount), VIBES_DECIMALS);
  if (amountWei > maxWei) {
    throw new ApiError(`Tip exceeds the ${cfg.maxTipAmount} $VIBES per-tip cap`, 400, 'OVER_CAP');
  }

  // replay protection: a (wallet, nonce) pair settles exactly once
  const fresh = await claimNonce(env, auth.from, auth.nonce);
  if (!fresh) throw new ApiError('This authorization was already used', 409, 'REPLAY');

  // signature
  await verifyTipAuthorization(env, auth, signature);

  // the recipient must be a real jar (keeps the agent tips meaningful)
  if (cfg.requireJar && !input.skipJarCheck) {
    const jar = await getJar(env, auth.to);
    if (!jar) throw new ApiError('Recipient has no VibeMusic jar', 400, 'NO_JAR');
  }

  // daily spend cap
  const spend = await getDailySpend(env, auth.from);
  const amountHuman = Number(fromWei(amountWei));
  if (spend + amountHuman > cfg.dailySpendCap) {
    throw new ApiError(
      `Daily spend cap reached (${spend}/${cfg.dailySpendCap} $VIBES)`,
      429,
      'DAILY_CAP',
    );
  }

  // relay — the relayer holds the ETH, the agent holds only $VIBES
  const { txHash, blockNumber } = await relayTip(env, {
    from: auth.from,
    to: auth.to,
    amountWei,
  });
  await addDailySpend(env, auth.from, amountHuman);

  const tip: Tip = {
    id: `tip_${uid()}`,
    from: auth.from,
    to: auth.to,
    amount: String(amountHuman),
    message: null,
    txHash,
    timestamp: Date.now(),
    isAgent: true,
    reason: auth.reason,
    trackId: auth.trackId,
    trackTitle: input.trackTitle ?? null,
    missionId: auth.missionId,
  };
  await recordTip(env, tip);

  console.log('[vibemusic] agent tip settled', { txHash, block: blockNumber, amount: tip.amount, to: tip.to });
  return tip;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Mission runner
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function runMission(env: Env, prompt: string): Promise<AgentMission> {
  const cfg = config(env);
  const missionId = `m_${uid()}`;
  const steps: AgentStep[] = [];
  const startedAt = Date.now();

  const push = (
    stage: AgentStep['stage'],
    text: string,
    extra: Partial<AgentStep> & { detail?: string | null } = {},
  ) => {
    steps.push({ stage, text, at: Date.now(), ...extra });
  };

  const mission: AgentMission = {
    id: missionId,
    prompt,
    status: 'running',
    createdAt: startedAt,
    finishedAt: null,
    considered: 0,
    selected: 0,
    tipped: 0,
    skipped: 0,
    totalAmount: '0',
    steps,
    evaluator: 'rules',
  };

  try {
    const intent = parseIntent(prompt);
    push('discover', `Scanning Audius for “${prompt}”`, {
      detail: `intent: ${intent.brief}`,
    });

    /* ── 1. discover ──────────────────────────────────────────────────── */
    const candidates = await discover(intent.genres, intent.genres[0] ?? prompt.split(/\s+/).slice(0, 3).join(' '));
    mission.considered = candidates.length;
    if (!candidates.length) {
      push('error', 'Audius returned no candidates', { detail: 'try a broader mission' });
      mission.status = 'failed';
      mission.error = 'No candidates from Audius';
      mission.finishedAt = Date.now();
      await saveMission(env, mission);
      return mission;
    }

    /* ── 2. score ─────────────────────────────────────────────────────── */
    const recent = await recentTips(env, 50);
    const penaltyIds = recent
      .filter((t) => t.isAgent && Date.now() - t.timestamp < 24 * 3600_000)
      .map((t) => t.trackId)
      .filter((x): x is string => !!x);

    const scored = candidates.map((t) => scoreTrack(t, intent, { missionSeed: missionId, penaltyIds }));
    const { selected: qualifying, rejected } = selectTracks(scored, { limit: 40, minScore: cfg.minScore });

    push(
      'evaluate',
      `Scored ${scored.length} tracks · ${qualifying.length} cleared ${cfg.minScore}/100`,
      {
        detail:
          (qualifying.length ? qualifying : [...scored].sort((a, b) => b.score - a.score))
            .slice(0, 3)
            .map((s) => `${s.track.title.slice(0, 26)} (${s.score})`)
            .join(' · ') || 'no candidates',
      },
    );

    // Prefer artists who actually claimed a VibeMusic jar: a tip is only useful if
    // it can land in a real wallet. Everyone else is logged as a skip.
    const pool = await Promise.all(
      qualifying.slice(0, 8).map(async (s) => ({
        scored: s,
        wallet: s.track.artistHandle ? await walletForHandle(env, s.track.artistHandle) : null,
      })),
    );
    const claimable = pool.filter((p) => !!p.wallet).slice(0, cfg.maxTipsPerMission);
    const selection = claimable.length
      ? claimable
      : qualifying.slice(0, cfg.maxTipsPerMission).map((s) => ({ scored: s, wallet: null as string | null }));

    mission.selected = selection.length;
    mission.skipped = Math.max(0, candidates.length - selection.length);

    if (!selection.length) {
      push('done', 'Nothing cleared the quality bar — the agent keeps its $VIBES', {
        detail: scored.length ? `top score ${Math.max(...scored.map((s) => s.score))}/100` : 'no candidates',
      });
      mission.status = 'done';
      mission.finishedAt = Date.now();
      await saveMission(env, mission);
      return mission;
    }

    /* ── 3. match jars → sign → relay ─────────────────────────────────── */
    let total = 0;

    for (const item of selection) {
      const s = item.scored;
      const track = s.track;
      let wallet = item.wallet;

      if (!wallet) {
        wallet = track.artistHandle ? await walletForHandle(env, track.artistHandle) : null;
      }

      if (!wallet || !(await getJar(env, wallet))) {
        mission.skipped += 1;
        push('skip', `Skipped @${track.artistHandle} — no VibeMusic jar linked`, {
          detail: `“${track.title}” scored ${s.score}/100 but has no wallet to pay`,
          trackTitle: track.title,
          artist: track.artist,
          artwork: track.artwork,
        });
        continue;
      }

      // respect the daily cap and the per-tip cap
      const spend = await getDailySpend(env, agentAddress(env));
      const remaining = Math.max(0, cfg.dailySpendCap - spend);
      const amount = Math.min(s.suggestedAmount, cfg.maxTipAmount, Math.floor(remaining));
      if (amount < 1) {
        push('skip', 'Daily spend cap reached — stopping here', { detail: `${spend} $VIBES spent today` });
        break;
      }

      const amountWei = parseUnits(String(amount), VIBES_DECIMALS);
      const auth: TipAuthorization = {
        from: agentAddress(env),
        to: wallet as `0x${string}`,
        amount: amountWei.toString(),
        nonce: String(Date.now()) + Math.floor(Math.random() * 1000),
        deadline: String(nowSec() + 600),
        missionId,
        reason: s.reason.slice(0, 300),
        trackId: track.id,
      };

      push('sign', `Signing EIP-712 authorization for “${track.title}”`, {
        detail: `no gas, no ETH — ${amount} $VIBES authorized to @${track.artistHandle}`,
        trackTitle: track.title,
        artist: track.artist,
        artwork: track.artwork,
        amount: String(amount),
      });

      const signature = await agentAccount(env).signTypedData({
        domain: tipDomain(CHAIN_ID),
        types: TIP_TYPES,
        primaryType: 'TipAuthorization',
        message: toTypedMessage(auth),
      });

      try {
        const tip = await submitTip(env, {
          authorization: auth,
          signature,
          trackTitle: track.title,
          artist: track.artist,
          skipJarCheck: true, // already verified above
        });

        total += Number(tip.amount);
        mission.tipped += 1;
        push('relay', `Tipped @${track.artistHandle} ${tip.amount} $VIBES for “${track.title}”`, {
          detail: s.reason,
          txHash: tip.txHash,
          amount: tip.amount,
          trackTitle: track.title,
          artist: track.artist,
          artwork: track.artwork,
        });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : String(e);
        mission.skipped += 1;
        push('error', `Could not tip “${track.title}”`, { detail: msg });
        if (e instanceof ApiError && (e.code === 'NEEDS_APPROVAL' || e.code === 'INSUFFICIENT_VIBES')) {
          // a configuration problem: stop burning the whole mission
          break;
        }
      }
    }

    mission.totalAmount = total.toFixed(0);
    mission.status = 'done';
    mission.finishedAt = Date.now();
    push(
      'done',
      mission.tipped
        ? `Mission complete · ${mission.tipped} tip${mission.tipped === 1 ? '' : 's'} · ${mission.totalAmount} $VIBES`
        : 'Mission complete · no tips this round',
      { detail: 'gas sponsored by the VibeMusic relayer — the agent holds $VIBES only' },
    );
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
    mission.status = 'failed';
    mission.error = msg;
    mission.finishedAt = Date.now();
    push('error', 'Mission failed', { detail: msg });
  }

  await saveMission(env, mission);
  return mission;
}

/* ── discovery helpers ───────────────────────────────────────────────────── */

/**
 * Merge several Audius lanes into one deduped candidate pool:
 *   • global trending
 *   • genre-filtered trending (so a "chill" mission actually sees Lo-Fi)
 *   • a keyword search for the mission
 */
async function discover(genres: string[], query: string): Promise<AudiusTrack[]> {
  const lanes = [
    trendingTracks(8).catch(() => [] as AudiusTrack[]),
    ...genres.slice(0, 2).map((g) => trendingTracks(5, g).catch(() => [] as AudiusTrack[])),
    query ? searchTracks(query, 5).catch(() => [] as AudiusTrack[]) : Promise.resolve([] as AudiusTrack[]),
  ];
  const results = await Promise.all(lanes);

  const seen = new Set<string>();
  const out: AudiusTrack[] = [];
  for (const lane of results) {
    for (const t of lane) {
      if (!t?.id || seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}

/* ── agent status (console) ──────────────────────────────────────────────── */

export async function agentConsoleState(env: Env, base: Record<string, unknown>) {
  const agent = agentAddress(env);
  const [spend, tips] = await Promise.all([getDailySpend(env, agent), recentTips(env, 100)]);
  const todaysAgentTips = tips.filter((t) => t.isAgent && Date.now() - t.timestamp < 86_400_000);
  return {
    ...base,
    tipsToday: todaysAgentTips.length,
    spendToday: String(spend),
  };
}

export async function resolveJarForHandle(env: Env, handle: string) {
  return findJar(env, handle);
}
