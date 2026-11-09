/**
 * Cloudflare KV data layer.
 *
 * Key layout (all free-tier friendly, denormalised so reads stay cheap):
 *   jar:<wallet>            TipJar
 *   jar:slug:<slug>         wallet            (vanity handle → wallet)
 *   handle:<audiusHandle>   wallet            (agent discovery → tip jar)
 *   jars:recent             string[] (wallet, newest first, max 100)
 *   tips:recent             Tip[]    (max 100)
 *   tips:jar:<wallet>       Tip[]    (max 50)
 *   missions:recent         AgentMission[] (max 12, includes steps for the feed)
 *   nonce:<from>:<nonce>    "1"       (replay protection, 7 day TTL)
 *   spend:<agent>:<day>     number    (daily spend cap)
 */
import type { AgentMission, Tip, TipJar } from '../../shared/types';
import type { Env } from './env';
import { ApiError } from './http';

const MAX_JARS = 100;
const MAX_TIPS = 100;
const MAX_JAR_TIPS = 50;
const MAX_MISSIONS = 12;

export const K = {
  jar: (wallet: string) => `jar:${wallet.toLowerCase()}`,
  slug: (slug: string) => `jar:slug:${slug.toLowerCase()}`,
  handle: (h: string) => `handle:${h.toLowerCase()}`,
  jarList: 'jars:recent',
  tipsRecent: 'tips:recent',
  tipsJar: (wallet: string) => `tips:jar:${wallet.toLowerCase()}`,
  missions: 'missions:recent',
  nonce: (from: string, nonce: string) => `nonce:${from.toLowerCase()}:${nonce}`,
  spend: (addr: string, day: string) => `spend:${addr.toLowerCase()}:${day}`,
};

const lc = (s: string) => s.toLowerCase();

async function getJson<T>(env: Env, key: string): Promise<T | null> {
  const raw = await env.VIBES_KV.get(key, 'json');
  return (raw as T) ?? null;
}

async function putJson(env: Env, key: string, value: unknown, ttl?: number) {
  await env.VIBES_KV.put(key, JSON.stringify(value), ttl ? { expirationTtl: ttl } : undefined);
}

/* ── jars ────────────────────────────────────────────────────────────────── */

export async function getJar(env: Env, wallet: string): Promise<TipJar | null> {
  return getJson<TipJar>(env, K.jar(wallet));
}

export async function saveJar(env: Env, jar: TipJar): Promise<void> {
  await putJson(env, K.jar(jar.wallet), jar);
  await env.VIBES_KV.put(K.slug(jar.slug), lc(jar.wallet));
  for (const h of jar.audiusHandles ?? []) {
    await env.VIBES_KV.put(K.handle(h), lc(jar.wallet));
  }
  const list = (await getJson<string[]>(env, K.jarList)) ?? [];
  const next = [lc(jar.wallet), ...list.filter((w) => w !== lc(jar.wallet))].slice(0, MAX_JARS);
  await putJson(env, K.jarList, next);
}

/** Resolve a jar by wallet, vanity slug, or Audius handle. */
export async function findJar(env: Env, idOrHandle: string): Promise<TipJar | null> {
  const id = decodeURIComponent(idOrHandle).replace(/^@/, '').trim();
  if (!id) return null;

  if (/^0x[0-9a-fA-F]{40}$/.test(id)) {
    return getJar(env, id);
  }

  const bySlug = await env.VIBES_KV.get(K.slug(id));
  if (bySlug) {
    const jar = await getJar(env, bySlug);
    if (jar) return jar;
  }

  const byHandle = await env.VIBES_KV.get(K.handle(id));
  if (byHandle) {
    const jar = await getJar(env, byHandle);
    if (jar) return jar;
  }

  // last resort: scan recent jars for a fuzzy match (small set)
  const jars = await listJars(env, MAX_JARS);
  return (
    jars.find(
      (j) => lc(j.slug) === lc(id) || j.audiusHandles?.some((h) => lc(h) === lc(id)),
    ) ?? null
  );
}

export async function listJars(env: Env, limit = 24): Promise<TipJar[]> {
  const list = (await getJson<string[]>(env, K.jarList)) ?? [];
  const wallets = list.slice(0, limit);
  const jars = await Promise.all(wallets.map((w) => getJar(env, w)));
  return jars.filter((j): j is TipJar => !!j);
}

/** Agent discovery: which wallet (if any) claimed this Audius handle? */
export async function walletForHandle(env: Env, handle: string): Promise<string | null> {
  return env.VIBES_KV.get(K.handle(handle));
}

/* ── tips ────────────────────────────────────────────────────────────────── */

export async function recordTip(env: Env, tip: Tip): Promise<Tip> {
  // per-jar feed
  const jarKey = K.tipsJar(tip.to);
  const jarTips = (await getJson<Tip[]>(env, jarKey)) ?? [];
  await putJson(env, jarKey, [tip, ...jarTips].slice(0, MAX_JAR_TIPS));

  // global feed
  const recent = (await getJson<Tip[]>(env, K.tipsRecent)) ?? [];
  await putJson(env, K.tipsRecent, [tip, ...recent].slice(0, MAX_TIPS));

  // denormalised aggregates on the jar (cheap reads for the UI)
  const jar = await getJar(env, tip.to);
  if (jar) {
    await putJson(env, K.jar(jar.wallet), {
      ...jar,
      tipCount: (jar.tipCount ?? 0) + 1,
      totalReceived: String(Number(jar.totalReceived ?? 0) + Number(tip.amount || 0)),
    });
  }
  return tip;
}

export async function recentTips(env: Env, limit = 12): Promise<Tip[]> {
  const tips = (await getJson<Tip[]>(env, K.tipsRecent)) ?? [];
  return tips.slice(0, limit);
}

export async function jarTips(env: Env, wallet: string, limit = MAX_JAR_TIPS): Promise<Tip[]> {
  const tips = (await getJson<Tip[]>(env, K.tipsJar(wallet))) ?? [];
  return tips.slice(0, limit);
}

/* ── missions ────────────────────────────────────────────────────────────── */

export async function saveMission(env: Env, mission: AgentMission): Promise<void> {
  const list = (await getJson<AgentMission[]>(env, K.missions)) ?? [];
  const next = [mission, ...list.filter((m) => m.id !== mission.id)].slice(0, MAX_MISSIONS);
  await putJson(env, K.missions, next);
}

export async function recentMissions(env: Env, limit = MAX_MISSIONS): Promise<AgentMission[]> {
  const list = (await getJson<AgentMission[]>(env, K.missions)) ?? [];
  return list.slice(0, limit);
}

/* ── replay protection + spend caps ──────────────────────────────────────── */

/** Returns true exactly once per (agent, nonce). TTL 7 days. */
export async function claimNonce(env: Env, from: string, nonce: string): Promise<boolean> {
  const key = K.nonce(from, nonce);
  const existing = await env.VIBES_KV.get(key);
  if (existing) return false;
  await env.VIBES_KV.put(key, '1', { expirationTtl: 7 * 24 * 3600 });
  return true;
}

export function utcDay(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export async function getDailySpend(env: Env, agent: string): Promise<number> {
  const raw = await env.VIBES_KV.get(K.spend(agent, utcDay()));
  return Number(raw ?? 0) || 0;
}

export async function addDailySpend(env: Env, agent: string, amount: number): Promise<number> {
  const current = await getDailySpend(env, agent);
  const next = current + amount;
  await env.VIBES_KV.put(K.spend(agent, utcDay()), String(next), { expirationTtl: 3 * 24 * 3600 });
  return next;
}

/* ── stats ───────────────────────────────────────────────────────────────── */

export async function computeStats(env: Env) {
  const [jars, tips] = await Promise.all([listJars(env, MAX_JARS), recentTips(env, MAX_TIPS)]);
  const trackCount = jars.reduce((n, j) => n + (j.tracks?.length ?? 0), 0);
  const totalVolume = tips.reduce((n, t) => n + Number(t.amount || 0), 0);
  const agentTips = tips.filter((t) => t.isAgent);
  const agentVolume = agentTips.reduce((n, t) => n + Number(t.amount || 0), 0);

  return {
    jarCount: jars.length,
    artistCount: jars.length,
    trackCount,
    tipCount: tips.length,
    agentTipCount: agentTips.length,
    totalVolume: totalVolume.toFixed(0),
    agentVolume: agentVolume.toFixed(0),
  };
}

/* ── validation helpers ──────────────────────────────────────────────────── */

export function assertSlug(slug: string): string {
  const s = (slug || '').toLowerCase().trim();
  if (!/^[a-z0-9_-]{2,24}$/.test(s)) {
    throw new ApiError('Handle must be 2–24 chars (a-z, 0-9, "-", "_")', 400, 'BAD_SLUG');
  }
  return s;
}

export function assertAudiusTracks(tracks: unknown): TipJar['tracks'] {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new ApiError('Link at least one Audius track', 400, 'NO_TRACKS');
  }
  if (tracks.length > 3) throw new ApiError('Maximum 3 tracks', 400, 'TOO_MANY_TRACKS');
  return tracks.map((t: any) => ({
    id: String(t.id),
    trackId: t.trackId ?? null,
    title: String(t.title ?? 'Untitled').slice(0, 200),
    artist: String(t.artist ?? '').slice(0, 120),
    artistHandle: String(t.artistHandle ?? '').slice(0, 80),
    artistId: t.artistId ?? null,
    artwork: t.artwork ?? null,
    duration: t.duration ?? null,
    genre: t.genre ?? null,
    mood: t.mood ?? null,
    playCount: t.playCount ?? null,
    favoriteCount: t.favoriteCount ?? null,
    repostCount: t.repostCount ?? null,
    tags: t.tags ?? null,
    description: (t.description ?? '')?.toString().slice(0, 400) ?? null,
    releaseDate: t.releaseDate ?? null,
    permalink: t.permalink ?? null,
    streamEndpoint: t.streamEndpoint ?? null,
    streamUrl: t.streamUrl ?? null,
  }));
}
