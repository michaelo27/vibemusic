/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VibeMusic agent brain — deterministic, explainable, $0 (no LLM required).
 * ─────────────────────────────────────────────────────────────────────────────
 * A mission prompt is parsed into an "intent", every Audius track gets a
 * 0-100 quality score with a per-signal breakdown, and the agent can always
 * explain *why* it tipped (that reason ends up on-chain-adjacent in the feed).
 *
 * Pure functions only: imported by the Worker (real missions), the standalone
 * agent runtime, and the frontend (demo mode previews).
 */
import type { AudiusTrack } from './types';

/* ── tiny formatters ─────────────────────────────────────────────────────── */

export function formatCount(n?: number | null): string {
  if (n == null) return '—';
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function formatAge(iso?: string | null, now = Date.now()): string {
  if (!iso) return 'unknown age';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'unknown age';
  const days = Math.max(0, (now - t) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 45) return `${Math.round(days)} days ago`;
  if (days < 400) return `${Math.round(days / 30)} months ago`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')} years ago`;
}

/* ── mission intents ─────────────────────────────────────────────────────── */

export type MissionIntent = {
  raw: string;
  genres: string[];
  moods: string[];
  tags: string[];
  wantsFresh: boolean;
  wantsUnderrated: boolean;
  wantsQuality: boolean;
  allowLong: boolean;
  /** short human summary, e.g. "chill + mellow tracks, freshness weighted" */
  brief: string;
};

/** Preset missions shown in the UI ("Let the agent cook"). */
export const MISSION_PRESETS = [
  {
    id: 'chill',
    emoji: '🌙',
    label: 'Tip the best chill tracks right now',
    prompt: 'Tip the best chill tracks right now',
  },
  {
    id: 'electronic',
    emoji: '⚡️',
    label: 'Find high-quality electronic tracks and tip the artists',
    prompt: 'Find high-quality electronic tracks and tip the artists',
  },
  {
    id: 'underrated',
    emoji: '💎',
    label: 'Reward underrated lo-fi artists with under 5k plays',
    prompt: 'Reward underrated lo-fi artists with under 5k plays',
  },
  {
    id: 'fresh',
    emoji: '🌱',
    label: 'Tip fresh drops from the last two weeks',
    prompt: 'Tip fresh drops from the last two weeks',
  },
] as const;

const GENRE_MAP: Record<string, string[]> = {
  chill: ['Lo-Fi', 'Ambient', 'Downtempo', 'R&B/Soul', 'Jazz', 'Chill', 'Acoustic', 'Classical'],
  lofi: ['Lo-Fi', 'Ambient', 'Downtempo'],
  'lo-fi': ['Lo-Fi', 'Ambient', 'Downtempo'],
  ambient: ['Ambient', 'Downtempo', 'Classical'],
  electronic: ['Electronic', 'House', 'Techno', 'Trance', 'Dubstep', 'Drum & Bass', 'Tech House', 'Electro', 'EDM'],
  edm: ['Electronic', 'House', 'Dubstep', 'Trance', 'Drum & Bass'],
  house: ['House', 'Tech House', 'Deep House'],
  techno: ['Techno', 'Tech House'],
  bass: ['Dubstep', 'Drum & Bass', 'Electronic'],
  dubstep: ['Dubstep', 'Bass'],
  hiphop: ['Hip-Hop/Rap', 'Rap', 'Trap'],
  'hip-hop': ['Hip-Hop/Rap', 'Rap', 'Trap'],
  rap: ['Hip-Hop/Rap', 'Rap', 'Trap'],
  pop: ['Pop', 'R&B/Soul'],
  rock: ['Rock', 'Alternative', 'Indie', 'Metal'],
  indie: ['Indie', 'Alternative', 'Rock', 'Folk'],
  jazz: ['Jazz', 'R&B/Soul'],
  soul: ['R&B/Soul', 'Jazz', 'Soul'],
  classical: ['Classical', 'Ambient'],
  piano: ['Classical', 'Ambient'],
  dance: ['House', 'Electronic', 'Dance'],
  afrobeat: ['Afrobeats', 'Afrobeat', 'World'],
  afrobeats: ['Afrobeats', 'Afrobeat', 'World'],
};

const MOOD_MAP: Record<string, string[]> = {
  chill: ['Peaceful', 'Calm', 'Cool', 'Mellow', 'Relaxing', 'Sentimental', 'Easygoing'],
  calm: ['Peaceful', 'Calm', 'Mellow', 'Relaxing'],
  mellow: ['Mellow', 'Peaceful', 'Calm'],
  relaxing: ['Peaceful', 'Calm', 'Relaxing'],
  sad: ['Melancholy', 'Sentimental', 'Somber', 'Sad'],
  happy: ['Happy', 'Upbeat', 'Empowering', 'Joyful', 'Excited'],
  upbeat: ['Upbeat', 'Happy', 'Excited', 'Empowering'],
  energetic: ['Fiery', 'Empowering', 'Excited', 'Aggressive', 'Intense'],
  dark: ['Brooding', 'Dark', 'Gritty', 'Somber', 'Suspenseful'],
  groovy: ['Groovy', 'Cool', 'Upbeat'],
  romantic: ['Romantic', 'Sentimental', 'Sensual'],
  focus: ['Peaceful', 'Calm', 'Mellow'],
  study: ['Peaceful', 'Calm', 'Mellow'],
};

const FRESH_RE = /\b(fresh|new|recent|rise|rising|now|today|latest|drop|drops|release)\b/i;
const UNDERRATED_RE = /\b(underrated|under-appreciated|hidden|undiscovered|small|low plays|5k|under)\b/i;
const QUALITY_RE = /\b(best|top|quality|great|good|amazing|excellent|nice|fire|beautiful)\b/i;
const LONG_OK_RE = /\b(mix|set|radio|podcast|dj|hour|live)\b/i;

/** Parse a free-text mission into a structured, explainable intent. */
export function parseIntent(prompt: string): MissionIntent {
  const raw = (prompt || '').trim() || 'Tip great music right now';
  const lower = raw.toLowerCase();
  const words = lower.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

  const genres = new Set<string>();
  const moods = new Set<string>();

  for (const w of words) {
    for (const g of GENRE_MAP[w] ?? []) genres.add(g);
    for (const m of MOOD_MAP[w] ?? []) moods.add(m);
  }

  const wantsFresh = FRESH_RE.test(lower);
  const wantsUnderrated = UNDERRATED_RE.test(lower);
  const wantsQuality = QUALITY_RE.test(lower) || !wantsFresh;

  const briefBits: string[] = [];
  if (genres.size) briefBits.push(`genres ${[...genres].slice(0, 3).join(' / ')}`);
  if (moods.size) briefBits.push(`moods ${[...moods].slice(0, 3).join(' / ')}`);
  if (wantsFresh) briefBits.push('freshness weighted');
  if (wantsUnderrated) briefBits.push('underrated boost');

  return {
    raw,
    genres: [...genres],
    moods: [...moods],
    tags: words.filter((w) => w.length > 3).slice(0, 6),
    wantsFresh,
    wantsUnderrated,
    wantsQuality,
    allowLong: LONG_OK_RE.test(lower),
    brief: briefBits.length ? briefBits.join(' · ') : 'open brief — pure quality score',
  };
}

/* ── scoring ─────────────────────────────────────────────────────────────── */

export type Signal = { key: string; points: number; note: string };

export type ScoredTrack = {
  track: AudiusTrack;
  score: number;
  signals: Signal[];
  /** one-line human reason, shown in the agent feed */
  reason: string;
  /** suggested tip size in whole $VIBES */
  suggestedAmount: number;
};

const norm = (s?: string | null) => (s ?? '').toLowerCase().trim();

/** Base58-ish deterministic hash → stable 0..1 jitter so runs vary but replay. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export type ScoreOptions = {
  /** varies the jitter so two missions over the same catalogue aren't identical */
  missionSeed?: string;
  /** tracks already tipped by the agent recently get pushed down */
  penaltyIds?: string[];
};

export function scoreTrack(track: AudiusTrack, intent: MissionIntent, opts: ScoreOptions = {}): ScoredTrack {
  const signals: Signal[] = [];
  const genre = norm(track.genre);
  const mood = norm(track.mood);

  /* 0. baseline — an unconstrained mission starts higher, a picky one lower */
  const baseline = intent.genres.length || intent.moods.length ? 22 : 30;

  /* 1. genre fit (−10 … +24) */
  if (intent.genres.length) {
    const hit = intent.genres.find((g) => genre.includes(norm(g)) || norm(g).includes(genre));
    if (hit) signals.push({ key: 'genre', points: 24, note: `${track.genre} fits your brief` });
    else if (genre) signals.push({ key: 'genre', points: -10, note: `${track.genre} is off-brief` });
  } else if (genre) {
    signals.push({ key: 'genre', points: 6, note: `tagged ${track.genre}` });
  }

  /* 2. mood fit (0 … +14) */
  if (intent.moods.length) {
    const hit = intent.moods.find((m) => mood.includes(norm(m)));
    if (hit) signals.push({ key: 'mood', points: 14, note: `${track.mood} mood match` });
  } else if (mood) {
    signals.push({ key: 'mood', points: 5, note: `${track.mood} mood` });
  }

  /* 3. engagement (0 … +20) — log scale so whales don't steamroll small artists */
  const plays = track.playCount ?? 0;
  const favs = track.favoriteCount ?? 0;
  const engage = plays > 0 ? Math.min(14, Math.round(Math.log10(plays + 1) * 3.4)) : 0;
  if (engage) signals.push({ key: 'plays', points: engage, note: `${formatCount(plays)} plays` });

  const likeRate = plays > 20 ? favs / plays : 0;
  if (likeRate >= 0.02) signals.push({ key: 'likes', points: 6, note: `strong like-rate (${(likeRate * 100).toFixed(1)}%)` });
  else if (favs >= 25) signals.push({ key: 'likes', points: 3, note: `${formatCount(favs)} likes` });

  /* 4. freshness (0 … +10) */
  const ageDays = ageInDays(track.releaseDate);
  if (Number.isFinite(ageDays) && ageDays >= 0) {
    const ageLabel = formatAge(track.releaseDate);
    if (ageDays <= 14) signals.push({ key: 'fresh', points: intent.wantsFresh ? 10 : 8, note: `fresh drop (${ageLabel})` });
    else if (ageDays <= 30) signals.push({ key: 'fresh', points: 6, note: `recent (${ageLabel})` });
    else if (ageDays <= 120) signals.push({ key: 'fresh', points: 2, note: `a few months old` });
  }

  /* 5. hidden-gem boost */
  if (intent.wantsUnderrated) {
    if (plays < 5000 && favs >= 15) signals.push({ key: 'gem', points: 10, note: `hidden gem — only ${formatCount(plays)} plays` });
    else if (plays > 50_000) signals.push({ key: 'gem', points: -8, note: `already big (${formatCount(plays)} plays)` });
  }

  /* 6. craft / metadata completeness (0 … +8) */
  let craft = 0;
  if (track.artwork) craft += 2;
  if ((track.description ?? '').length > 40) craft += 2;
  const dur = track.duration ?? 0;
  if (dur >= 60 && dur <= 600) craft += 3;
  if (track.tags && track.tags.split(',').length >= 3) craft += 1;
  if (craft) signals.push({ key: 'craft', points: craft, note: craft >= 6 ? 'well-produced drop (art, notes, tight runtime)' : 'decent metadata' });

  /* 7. penalties */
  if (dur > 1200 && !intent.allowLong) signals.push({ key: 'length', points: -8, note: `long runtime (${Math.round(dur / 60)} min)` });
  if (dur > 0 && dur < 45) signals.push({ key: 'length', points: -6, note: 'very short clip' });
  if (!track.artistHandle) signals.push({ key: 'identity', points: -4, note: 'no artist handle' });
  if (opts.penaltyIds?.includes(track.id)) signals.push({ key: 'repeat', points: -14, note: 'tipped recently' });

  /* 8. tiny deterministic jitter (variety across runs, stable on replay) */
  const jitter = Math.round(hash01(track.id + (opts.missionSeed ?? '')) * 6) - 3;
  if (jitter) signals.push({ key: 'variety', points: jitter, note: 'variety nudge' });

  const rawScore = baseline + signals.reduce((s, x) => s + x.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const positives = signals
    .filter((s) => s.points > 0 && s.key !== 'variety')
    .sort((a, b) => b.points - a.points);
  const highlights = positives.slice(0, 3).map((s) => s.note);
  const reason = [highlights.length ? highlights.join(' · ') : 'solid all-round metadata', `${score}/100`].join(' — ');

  const amount = score >= 88 ? 25 : score >= 80 ? 18 : score >= 72 ? 12 : 8;

  return { track, score, signals, reason, suggestedAmount: amount };
}

function ageInDays(iso?: string | null): number {
  if (!iso) return Number.NaN;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return Number.NaN;
  return (Date.now() - t) / 86_400_000;
}

export type SelectOptions = {
  limit: number;
  minScore: number;
  /** only tip one track per artist per mission */
  onePerArtist?: boolean;
};

export function selectTracks(
  scored: ScoredTrack[],
  { limit, minScore, onePerArtist = true }: SelectOptions,
): { selected: ScoredTrack[]; rejected: ScoredTrack[] } {
  const sorted = [...scored].sort((a, b) => b.score - a.score || a.track.id.localeCompare(b.track.id));
  const selected: ScoredTrack[] = [];
  const rejected: ScoredTrack[] = [];
  const artists = new Set<string>();

  for (const s of sorted) {
    if (selected.length >= limit) {
      rejected.push(s);
      continue;
    }
    const artistKey = norm(s.track.artistHandle || s.track.artist);
    if (s.score < minScore) {
      rejected.push(s);
      continue;
    }
    if (onePerArtist && artists.has(artistKey)) {
      rejected.push(s);
      continue;
    }
    artists.add(artistKey);
    selected.push(s);
  }
  return { selected, rejected };
}
