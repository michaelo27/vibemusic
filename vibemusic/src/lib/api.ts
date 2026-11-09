/**
 * Single data-access layer for the app.
 *
 *  • LIVE  → talks to the Cloudflare Worker (relayer + KV + agent runtime)
 *  • DEMO  → everything local, auto-selected when NEXT_PUBLIC_API_BASE is empty
 *
 * Components only ever import `api`, so switching modes is a one-line env change.
 */
import { demoApi, resetDemo } from './demo';
import type {
  AgentEvent,
  AgentMission,
  AgentState,
  AudiusTrack,
  JarInput,
  Stats,
  Tip,
  TipJar,
} from './types';

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
export const IS_DEMO = !API_BASE;

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    throw new ApiError(json?.error || `Request failed (${res.status})`, json?.code);
  }
  return json as T;
}

export const api = {
  mode: IS_DEMO ? ('demo' as const) : ('live' as const),

  async listJars(): Promise<TipJar[]> {
    if (IS_DEMO) return demoApi.listJars();
    const { jars } = await req<{ jars: TipJar[] }>('/api/jars');
    return jars ?? [];
  },

  async getJar(idOrHandle: string): Promise<{ jar: TipJar; tips: Tip[] } | null> {
    if (IS_DEMO) return demoApi.getJar(idOrHandle);
    const res = await fetch(`${API_BASE}/api/jars/${encodeURIComponent(idOrHandle)}`);
    if (res.status === 404) return null;
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.jar) return null;
    return { jar: json.jar, tips: json.tips ?? [] };
  },

  async createJar(input: JarInput, auth?: { signature?: string; timestamp?: number }): Promise<TipJar> {
    if (IS_DEMO) return demoApi.createJar(input);
    const { jar } = await req<{ jar: TipJar }>('/api/jars', {
      method: 'POST',
      body: JSON.stringify({ input, signature: auth?.signature, timestamp: auth?.timestamp }),
    });
    return jar;
  },

  async recentTips(limit = 12): Promise<Tip[]> {
    if (IS_DEMO) return demoApi.recentTips(limit);
    const { tips } = await req<{ tips: Tip[] }>(`/api/tips?limit=${limit}`);
    return tips ?? [];
  },

  /** Called after a human's on-chain transfer confirms (Worker re-verifies the tx). */
  async recordTip(input: {
    txHash?: string | null;
    to: string;
    amount: string;
    message?: string | null;
    from?: string | null;
  }): Promise<Tip> {
    if (IS_DEMO) return demoApi.recordTip(input);
    const { tip } = await req<{ tip: Tip }>('/api/tips', { method: 'POST', body: JSON.stringify(input) });
    return tip;
  },

  async agentState(): Promise<AgentState> {
    if (IS_DEMO) return demoApi.agentState();
    return req<AgentState>('/api/agent/state');
  },

  async agentEvents(limit = 40): Promise<AgentEvent[]> {
    if (IS_DEMO) return demoApi.agentEvents(limit);
    const { events } = await req<{ events: AgentEvent[] }>(`/api/agent/events?limit=${limit}`);
    return events ?? [];
  },

  async missions(limit = 10): Promise<AgentMission[]> {
    if (IS_DEMO) return demoApi.missions(limit);
    const { missions } = await req<{ missions: AgentMission[] }>(`/api/agent/missions?limit=${limit}`);
    return missions ?? [];
  },

  async stats(): Promise<Stats> {
    if (IS_DEMO) return demoApi.stats();
    return req<Stats>('/api/stats');
  },

  async runMission(prompt: string): Promise<AgentMission> {
    if (IS_DEMO) return demoApi.runMission(prompt);
    const { mission } = await req<{ mission: AgentMission }>('/api/agent/run', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    return mission;
  },

  async resolveTrack(input: string): Promise<AudiusTrack> {
    if (IS_DEMO) return demoApi.resolveTrack(input);
    const { track } = await req<{ track: AudiusTrack }>(`/api/audius/track?q=${encodeURIComponent(input)}`);
    return track;
  },

  presets: demoApi.presets,
  resetDemo,
};
