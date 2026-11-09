/** Bindings + configuration for the VibeMusic Worker. */
export interface Env {
  /** KV namespace: jars, tips, missions, nonces, spend counters */
  VIBES_KV: KVNamespace;

  /** Agent wallet private key — holds $VIBES only, never needs ETH */
  AGENT_PRIVATE_KEY: string;
  /** Relayer wallet private key — holds a little ETH and pays every tip's gas */
  RELAYER_PRIVATE_KEY: string;

  // vars (wrangler.toml)
  APP_NAME?: string;
  BASE_RPC_URL?: string;
  MAX_TIP_AMOUNT?: string;
  MIN_SCORE?: string;
  MAX_TIPS_PER_MISSION?: string;
  DAILY_SPEND_CAP?: string;
  ALLOWED_ORIGINS?: string;
  REQUIRE_TIP_JAR?: string;
}

export const VIBES_TOKEN = '0xefFC8815487084a97edfdfF968b56Ea123421Acb' as const;
export const VIBES_DECIMALS = 18;
export const CHAIN_ID = 8453;
export const DEFAULT_RPC = 'https://mainnet.base.org';
export const AUDIUS_API = 'https://api.audius.co/v1';

export const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = (env: Env) => ({
  rpcUrl: env.BASE_RPC_URL || DEFAULT_RPC,
  appName: env.APP_NAME || 'VibeMusic',
  maxTipAmount: num(env.MAX_TIP_AMOUNT, 100),
  minScore: num(env.MIN_SCORE, 68),
  maxTipsPerMission: Math.min(3, num(env.MAX_TIPS_PER_MISSION, 2)),
  dailySpendCap: num(env.DAILY_SPEND_CAP, 500),
  requireJar: (env.REQUIRE_TIP_JAR ?? 'true') !== 'false',
  allowedOrigins: env.ALLOWED_ORIGINS || '*',
});
