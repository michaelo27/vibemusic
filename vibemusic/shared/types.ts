/**
 * VibeMusic domain types — the single source of truth shared by:
 *   • the Next.js frontend (src/lib/types.ts re-exports this file)
 *   • the Cloudflare Worker relayer/agent (worker/src/*)
 *   • the standalone agent runtime (agent/src/*)
 */

export type AudiusTrack = {
  /** Audius base58 track id, e.g. "AK3w5q0" */
  id: string;
  /** numeric track id used by some endpoints */
  trackId?: number | null;
  title: string;
  artist: string;
  artistHandle: string;
  artistId?: string | null;
  artwork?: string | null;
  duration?: number | null;
  genre?: string | null;
  mood?: string | null;
  playCount?: number | null;
  favoriteCount?: number | null;
  repostCount?: number | null;
  tags?: string | null;
  description?: string | null;
  releaseDate?: string | null;
  permalink?: string | null;
  /** time-limited signed stream URL (may expire) */
  streamUrl?: string | null;
  /** stable endpoint that 302s to a fresh signed stream url */
  streamEndpoint?: string | null;
};

export type TipJar = {
  wallet: string;
  /** vanity handle, e.g. "luna" → /@luna */
  slug: string;
  name: string;
  bio: string;
  x?: string | null;
  image?: string | null;
  /** lowercased Audius handles linked through this jar (used for agent matching) */
  audiusHandles: string[];
  tracks: AudiusTrack[];
  createdAt: number;
  updatedAt?: number;
  /** derived aggregates, filled by the API */
  totalReceived?: string;
  tipCount?: number;
};

export type Tip = {
  id: string;
  from: string;
  to: string;
  /** human units, e.g. "25" */
  amount: string;
  message?: string | null;
  txHash?: string | null;
  timestamp: number;
  isAgent: boolean;
  /** human readable agent reasoning */
  reason?: string | null;
  trackId?: string | null;
  trackTitle?: string | null;
  missionId?: string | null;
};

export type AgentStep = {
  stage: 'discover' | 'evaluate' | 'select' | 'sign' | 'relay' | 'skip' | 'done' | 'error';
  text: string;
  detail?: string | null;
  at: number;
  trackTitle?: string | null;
  artist?: string | null;
  artwork?: string | null;
  txHash?: string | null;
  amount?: string | null;
};

export type AgentMission = {
  id: string;
  prompt: string;
  status: 'running' | 'done' | 'failed';
  createdAt: number;
  finishedAt?: number | null;
  considered: number;
  selected: number;
  tipped: number;
  skipped: number;
  totalAmount: string;
  steps: AgentStep[];
  error?: string | null;
  evaluator?: 'rules' | 'rules+llm';
};

export type AgentState = {
  agentAddress: string;
  relayerAddress: string;
  vibesBalance: string;
  allowance: string;
  relayerEthBalance: string;
  maxTipAmount: string;
  approved: boolean;
  network: 'base';
  chainId: number;
  token: string;
  tipsToday?: number;
  spendToday?: string;
};

export type Stats = {
  jarCount: number;
  tipCount: number;
  agentTipCount: number;
  totalVolume: string;
  agentVolume: string;
  artistCount: number;
  trackCount: number;
};

export type JarInput = {
  wallet: string;
  slug: string;
  name: string;
  bio: string;
  x?: string | null;
  image?: string | null;
  tracks: AudiusTrack[];
};

/** EIP-712 payload the agent signs; the Worker verifies then relays it. */
export type TipAuthorization = {
  from: `0x${string}`;
  to: `0x${string}`;
  amount: string; // wei, decimal string (JSON-safe uint256)
  nonce: string; // unique decimal string
  deadline: string; // unix seconds, decimal string
  missionId: string;
  reason: string;
  trackId: string;
};

export type TipRequest = {
  authorization: TipAuthorization;
  signature: `0x${string}`;
  trackTitle?: string | null;
  artist?: string | null;
};

/** A flattened mission step, used by the public "Agent Activity" feed. */
export type AgentEvent = {
  id: string;
  at: number;
  missionId: string;
  prompt: string;
  stage: AgentStep['stage'];
  text: string;
  detail?: string | null;
  txHash?: string | null;
  amount?: string | null;
  trackTitle?: string | null;
  artist?: string | null;
  artwork?: string | null;
};
