/**
 * DEMO MODE data layer.
 *
 * When NEXT_PUBLIC_API_BASE is empty the app runs entirely in the browser:
 * jars/tips/missions live in localStorage and the agent is simulated locally
 * using the *real* scoring engine in shared/scoring.ts over real Audius tracks.
 *
 * This exists so judges (and you, offline) can feel the full product without
 * deploying anything. It is clearly labelled in the UI — no fake on-chain data
 * is ever presented as real.
 */
import { eventsFromMissions } from '../../shared/agent-events';
import {
  MISSION_PRESETS,
  parseIntent,
  scoreTrack,
  selectTracks,
  type ScoredTrack,
} from '../../shared/scoring';
import type {
  AgentEvent,
  AgentMission,
  AgentState,
  AgentStep,
  AudiusTrack,
  JarInput,
  Stats,
  Tip,
  TipJar,
} from './types';
import {
  DEMO_AGENT_ADDRESS,
  DEMO_AGENT_BALANCE,
  DEMO_ALLOWANCE,
  DEMO_CATALOGUE,
  DEMO_JARS,
  DEMO_MISSIONS,
  DEMO_RELAYER_ADDRESS,
  DEMO_TIPS,
} from './demo-fixtures';
import { resolveAudiusInput } from './audius';

const KEY = 'vibemusic:demo:v2';

type DemoState = {
  jars: TipJar[];
  tips: Tip[];
  missions: AgentMission[];
};

let memory: DemoState | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function seed(): DemoState {
  return {
    jars: JSON.parse(JSON.stringify(DEMO_JARS)),
    tips: JSON.parse(JSON.stringify(DEMO_TIPS)),
    missions: JSON.parse(JSON.stringify(DEMO_MISSIONS)),
  };
}

function read(): DemoState {
  if (typeof window === 'undefined') return memory ?? (memory = seed());
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as DemoState;
  } catch {
    return memory ?? (memory = seed());
  }
}

function write(state: DemoState) {
  memory = state;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — keep in memory */
  }
}

export function resetDemo() {
  const s = seed();
  write(s);
  return s;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

const lc = (s: string) => s.toLowerCase();

function fakeTx(seedStr: string): `0x${string}` {
  let h = '';
  let x = 0;
  for (let i = 0; i < seedStr.length; i++) x = (x * 31 + seedStr.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 64; i++) {
    x = (x * 1103515245 + 12345) >>> 0;
    h += '0123456789abcdef'[x % 16];
  }
  return `0x${h}`;
}

function withAggregates(jar: TipJar, tips: Tip[]): TipJar {
  const mine = tips.filter((t) => lc(t.to) === lc(jar.wallet));
  const total = mine.reduce((s, t) => s + Number(t.amount || 0), 0);
  return {
    ...jar,
    tipCount: mine.length,
    totalReceived: String(total),
  };
}

export function demoJarByArtist(handle?: string | null): TipJar | undefined {
  if (!handle) return undefined;
  const { jars } = read();
  return jars.find((j) => j.audiusHandles.some((h) => lc(h) === lc(handle)));
}

/* ── public demo API ─────────────────────────────────────────────────────── */

export const demoApi = {
  async listJars(): Promise<TipJar[]> {
    await sleep(120);
    const { jars, tips } = read();
    return jars
      .map((j) => withAggregates(j, tips))
      .sort((a, b) => Number(b.totalReceived ?? 0) - Number(a.totalReceived ?? 0) || b.createdAt - a.createdAt);
  },

  async getJar(idOrHandle: string): Promise<{ jar: TipJar; tips: Tip[] } | null> {
    await sleep(120);
    const { jars, tips } = read();
    const key = idOrHandle.replace(/^@/, '');
    const jar =
      jars.find((j) => lc(j.wallet) === lc(key)) ??
      jars.find((j) => lc(j.slug) === lc(key)) ??
      jars.find((j) => lc(j.audiusHandles.join(' ')).includes(lc(key)));
    if (!jar) return null;
    const jarTips = tips.filter((t) => lc(t.to) === lc(jar.wallet)).sort((a, b) => b.timestamp - a.timestamp);
    return { jar: withAggregates(jar, tips), tips: jarTips };
  },

  async createJar(input: JarInput): Promise<TipJar> {
    await sleep(300);
    const state = read();
    const now = Date.now();
    const slugTaken = state.jars.some((j) => lc(j.slug) === lc(input.slug) && lc(j.wallet) !== lc(input.wallet));
    const jar: TipJar = {
      wallet: input.wallet,
      slug: slugTaken ? `${input.slug}-${Math.floor(Math.random() * 90 + 10)}` : input.slug,
      name: input.name,
      bio: input.bio,
      x: input.x ?? null,
      image: input.image ?? null,
      audiusHandles: Array.from(new Set(input.tracks.map((t) => lc(t.artistHandle)).filter(Boolean))),
      tracks: input.tracks,
      createdAt: now,
      updatedAt: now,
    };
    state.jars = [jar, ...state.jars.filter((j) => lc(j.wallet) !== lc(input.wallet))];
    write(state);
    return jar;
  },

  async recentTips(limit = 12): Promise<Tip[]> {
    await sleep(80);
    return read().tips.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  },

  async recordTip(input: { to: string; amount: string; message?: string | null; from?: string | null; txHash?: string | null }): Promise<Tip> {
    const state = read();
    const jar = state.jars.find((j) => lc(j.wallet) === lc(input.to));
    const tip: Tip = {
      id: `demo-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      from: input.from || DEMO_RELAYER_ADDRESS,
      to: input.to,
      amount: input.amount,
      message: input.message ?? null,
      txHash: input.txHash ?? fakeTx(String(Date.now())),
      timestamp: Date.now(),
      isAgent: false,
      trackId: jar?.tracks[0]?.id ?? null,
      trackTitle: jar?.tracks[0]?.title ?? null,
    };
    state.tips = [tip, ...state.tips];
    write(state);
    return tip;
  },

  async agentState(): Promise<AgentState> {
    await sleep(60);
    const { tips } = read();
    const spent = tips.filter((t) => t.isAgent).reduce((s, t) => s + Number(t.amount || 0), 0);
    const today = tips
      .filter((t) => t.isAgent && Date.now() - t.timestamp < 86_400_000)
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    return {
      agentAddress: DEMO_AGENT_ADDRESS,
      relayerAddress: DEMO_RELAYER_ADDRESS,
      vibesBalance: String(Math.max(0, Number(DEMO_AGENT_BALANCE) - spent)),
      allowance: DEMO_ALLOWANCE,
      relayerEthBalance: '0.0143',
      maxTipAmount: '100',
      approved: true,
      network: 'base',
      chainId: 8453,
      token: '0xefFC8815487084a97edfdfF968b56Ea123421Acb',
      tipsToday: tips.filter((t) => t.isAgent && Date.now() - t.timestamp < 86_400_000).length,
      spendToday: String(today),
    };
  },

  async agentEvents(limit = 40): Promise<AgentEvent[]> {
    await sleep(80);
    return eventsFromMissions(read().missions, limit);
  },

  async missions(limit = 10): Promise<AgentMission[]> {
    await sleep(80);
    return read().missions.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },

  async stats(): Promise<Stats> {
    const { jars, tips } = read();
    const total = tips.reduce((s, t) => s + Number(t.amount || 0), 0);
    const agent = tips.filter((t) => t.isAgent).reduce((s, t) => s + Number(t.amount || 0), 0);
    return {
      jarCount: jars.length,
      tipCount: tips.length,
      agentTipCount: tips.filter((t) => t.isAgent).length,
      totalVolume: total.toFixed(0),
      agentVolume: agent.toFixed(0),
      artistCount: jars.length,
      trackCount: jars.reduce((s, j) => s + j.tracks.length, 0),
    };
  },

  /**
   * Simulated autonomous mission — the real rules engine, fake wallet layer.
   * Emits steps as they "happen" so the UI feels live.
   */
  async runMission(prompt: string, onStep?: (step: AgentStep) => void): Promise<AgentMission> {
    const state = read();
    const id = `demo-mission-${Date.now()}`;
    const intent = parseIntent(prompt);
    const steps: AgentStep[] = [];
    let total = 0;
    let tipped = 0;
    let skipped = 0;

    const push = (s: Omit<AgentStep, 'at'>) => {
      const step = { ...s, at: Date.now() } as AgentStep;
      steps.push(step);
      onStep?.(step);
    };

    push({
      stage: 'discover',
      text: `Scanning Audius for “${prompt}”`,
      detail: `intent: ${intent.brief}`,
    });
    await sleep(700);

    const scored = DEMO_CATALOGUE.map((t) => scoreTrack(t, intent, { missionSeed: id }));
    const { selected, rejected } = selectTracks(scored, { limit: 2, minScore: 66 });
    push({
      stage: 'evaluate',
      text: `Scored ${scored.length} tracks · ${selected.length} cleared the bar`,
      detail: `top: ${[...selected, ...rejected].slice(0, 3).map((s) => `${s.track.title.slice(0, 22)} (${s.score})`).join(' · ')}`,
    });
    await sleep(600);

    for (const s of selected) {
      const jar = demoJarByArtist(s.track.artistHandle);
      if (!jar) {
        skipped++;
        push({
          stage: 'skip',
          text: `Skipped @${s.track.artistHandle} — no VibeMusic jar linked`,
          detail: `“${s.track.title}” scored ${s.score}/100 but has no wallet to pay`,
          trackTitle: s.track.title,
          artist: s.track.artist,
          artwork: s.track.artwork,
        });
        await sleep(400);
        continue;
      }
      push({
        stage: 'sign',
        text: `Signing EIP-712 tip for “${s.track.title}”`,
        detail: `no ETH needed — the relayer pays gas`,
        trackTitle: s.track.title,
        artist: s.track.artist,
        artwork: s.track.artwork,
      });
      await sleep(500);
      const amount = String(s.suggestedAmount);
      const txHash = fakeTx(id + s.track.id);
      const tip: Tip = {
        id: `${id}-${s.track.id}`,
        from: DEMO_AGENT_ADDRESS,
        to: jar.wallet,
        amount,
        message: null,
        txHash,
        timestamp: Date.now(),
        isAgent: true,
        reason: s.reason,
        trackId: s.track.id,
        trackTitle: s.track.title,
        missionId: id,
      };
      state.tips = [tip, ...state.tips];
      total += Number(amount);
      tipped++;
      push({
        stage: 'relay',
        text: `Tipped @${s.track.artistHandle} ${amount} $VIBES for “${s.track.title}”`,
        detail: s.reason,
        txHash,
        amount,
        trackTitle: s.track.title,
        artist: s.track.artist,
        artwork: s.track.artwork,
      });
      await sleep(650);
    }

    const mission: AgentMission = {
      id,
      prompt,
      status: 'done',
      createdAt: Date.now() - steps.length * 600,
      finishedAt: Date.now(),
      considered: scored.length,
      selected: selected.length,
      tipped,
      skipped: skipped + rejected.length,
      totalAmount: total.toFixed(0),
      steps,
      evaluator: 'rules',
    };
    push({
      stage: 'done',
      text: `Mission complete · ${tipped} tip${tipped === 1 ? '' : 's'} · ${total} $VIBES`,
      detail: 'gas sponsored by the VibeMusic relayer — agent holds $VIBES only',
    });
    state.missions = [mission, ...state.missions].slice(0, 20);
    write(state);
    return mission;
  },

  resolveTrack(input: string): Promise<AudiusTrack> {
    return resolveAudiusInput(input);
  },

  presets: MISSION_PRESETS,
};

export type { ScoredTrack };
