/**
 * Audius public REST client (browser side).
 *
 * Audius sends `access-control-allow-origin: *`, so the browser can talk to it
 * directly — no key, no proxy needed for reads. We still keep a tiny resolver so
 * artists can paste anything (track URL, permalink, raw id, handle/slug).
 *
 * Docs: https://docs.audius.org/api/ (free, no API key for these endpoints)
 */
import type { AudiusTrack } from './types';

export const AUDIUS_API = 'https://api.audius.co/v1';
const APP_NAME = 'VibeMusic';

type RawTrack = Record<string, any>;

/** Turn an Audius API track object into our slim, storable shape. */
export function normalizeTrack(raw: RawTrack): AudiusTrack {
  const id: string = String(raw?.id ?? raw?.track_id ?? '');
  const user = raw?.user ?? {};
  const artwork =
    raw?.artwork?.['1000x1000'] ||
    raw?.artwork?.['480x480'] ||
    raw?.artwork?.['150x150'] ||
    user?.profile_picture?.['480x480'] ||
    null;

  return {
    id,
    trackId: raw?.track_id != null ? Number(raw.track_id) : null,
    title: raw?.title ?? 'Untitled',
    artist: user?.name ?? raw?.user?.handle ?? 'Unknown artist',
    artistHandle: user?.handle ?? '',
    artistId: user?.id ?? null,
    artwork,
    duration: raw?.duration ?? null,
    genre: raw?.genre ?? null,
    mood: raw?.mood ?? null,
    playCount: raw?.play_count ?? null,
    favoriteCount: raw?.favorite_count ?? null,
    repostCount: raw?.repost_count ?? null,
    tags: raw?.tags ?? null,
    description: raw?.description ?? null,
    releaseDate: raw?.release_date ?? raw?.created_at ?? null,
    permalink: raw?.permalink ?? null,
    // Keep a *stable* endpoint instead of the signed CDN url so playback never
    // expires between creating a jar and someone pressing play weeks later.
    streamEndpoint: id ? `${AUDIUS_API}/tracks/${id}/stream?app_name=${APP_NAME}` : null,
    streamUrl: raw?.stream?.url ?? null,
  };
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Audius request failed (${res.status})`);
  return res.json();
}

const withApp = (path: string) => `${AUDIUS_API}${path}${path.includes('?') ? '&' : '?'}app_name=${APP_NAME}`;

/** GET /v1/tracks/:id */
export async function getTrack(id: string): Promise<AudiusTrack> {
  const json = await getJson(withApp(`/tracks/${encodeURIComponent(id)}`));
  if (!json?.data?.id) throw new Error('Track not found on Audius');
  return normalizeTrack(json.data);
}

/** GET /v1/resolve?url= — accepts any audius.co URL (track / user / playlist). */
export async function resolveUrl(url: string): Promise<AudiusTrack> {
  const json = await getJson(withApp(`/resolve?url=${encodeURIComponent(url)}`));
  const data = json?.data;
  const track = Array.isArray(data) ? data[0] : data;
  if (!track?.id) throw new Error('Could not resolve that Audius link');
  return normalizeTrack(track);
}

/** GET /v1/tracks/search?query= */
export async function searchTracks(query: string, limit = 8): Promise<AudiusTrack[]> {
  const json = await getJson(withApp(`/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`));
  return (json?.data ?? []).map(normalizeTrack);
}

/** GET /v1/tracks/trending */
export async function trendingTracks(limit = 10, genre?: string): Promise<AudiusTrack[]> {
  const genreParam = genre ? `&genre=${encodeURIComponent(genre)}` : '';
  const json = await getJson(withApp(`/tracks/trending?limit=${limit}${genreParam}`));
  return (json?.data ?? []).map(normalizeTrack);
}

/**
 * Accepts: "AK3w5q0", "1424326672", "https://audius.co/handle/slug",
 * "audius.co/handle/slug", "handle/slug", or a bare search query ("cloud rap").
 */
export async function resolveAudiusInput(input: string): Promise<AudiusTrack> {
  const raw = input.trim();
  if (!raw) throw new Error('Paste an Audius track link or id');

  // Full URL → let Audius resolve it (handles permalinks, shortlinks, app links).
  if (/^https?:\/\//i.test(raw) || /^(www\.)?audius\.co\//i.test(raw)) {
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      return await resolveUrl(url);
    } catch {
      // fall through to id extraction below
    }
    const id = raw.split('/').pop()?.split('?')[0];
    if (id) return getTrack(id);
    throw new Error('Could not resolve that Audius link');
  }

  // Raw base58 track id (Audius ids are short, alphanumeric, no spaces).
  if (/^[A-Za-z0-9]{4,12}$/.test(raw) && !raw.includes(' ')) {
    try {
      return await getTrack(raw);
    } catch {
      /* not an id — treat as a search query */
    }
  }

  // handle/slug without protocol
  if (raw.includes('/')) {
    try {
      return await resolveUrl(`https://audius.co/${raw}`);
    } catch {
      /* ignore */
    }
  }

  // Fallback: best search hit.
  const results = await searchTracks(raw, 1);
  if (!results.length) throw new Error(`No Audius track matched “${raw}”`);
  return results[0];
}

/** Audius public web player URL for a track. */
export function audiusTrackUrl(track: AudiusTrack): string | null {
  if (track.permalink) return `https://audius.co${track.permalink}`;
  if (track.artistHandle && track.id) return `https://audius.co/${track.artistHandle}/track/${track.id}`;
  return null;
}
