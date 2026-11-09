/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VibeMusic Worker — one file, one deploy, $0 on the Cloudflare free tier.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Public API for the Next.js frontend (Cloudflare Pages) +
 *  the gasless relayer (executes agent-authorized $VIBES transfers) +
 *  the autonomous agent runtime (discover → judge → sign → relay).
 *
 * Routes
 *   GET  /api/health
 *   GET  /api/stats
 *   GET  /api/jars
 *   GET  /api/jars/:walletOrHandle
 *   POST /api/jars                  create/update a jar (EIP-191 proof)
 *   GET  /api/tips?limit=
 *   POST /api/tips                  record a human tip (verified on-chain)
 *   GET  /api/agent/state           balances, allowance, gas tank
 *   GET  /api/agent/events?limit=   flattened activity feed
 *   GET  /api/agent/missions?limit=
 *   POST /api/agent/run             run a mission now
 *   POST /api/agent/tip             relay an externally signed authorization
 *   GET  /api/audius/track?q=       resolve a track (link / id / search)
 *   GET  /api/audius/trending?limit=
 */
import { buildJarMessage, isValidAuthorization } from '../../shared/eip712';
import { eventsFromMissions } from '../../shared/agent-events';
import { resolveAudiusInput, trendingTracks } from '../../shared/audius';
import type { AudiusTrack, Tip, TipJar } from '../../shared/types';
import { agentAddress, readAgentState, verifyHumanTip, verifyWalletSignature } from './chain';
import { runMission, submitTip, agentConsoleState } from './agent';
import { CHAIN_ID, VIBES_TOKEN, config, type Env } from './env';
import { ApiError, corsHeaders, errorResponse, json, readJson } from './http';
import {
  assertAudiusTracks,
  assertSlug,
  computeStats,
  findJar,
  getJar,
  jarTips,
  listJars,
  recentMissions,
  recentTips,
  recordTip,
  saveJar,
} from './store';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cfg = config(env);
    const cors = corsHeaders(req.headers.get('origin'), cfg.allowedOrigins);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const route = `${req.method} ${path}`;

      /* ── health ─────────────────────────────────────────────────────── */
      if (route === 'GET /api/health' || route === 'GET /') {
        return json(
          {
            ok: true,
            app: cfg.appName,
            network: 'base',
            chainId: CHAIN_ID,
            token: VIBES_TOKEN,
            agent: agentAddress(env),
            limits: {
              maxTipAmount: cfg.maxTipAmount,
              minScore: cfg.minScore,
              maxTipsPerMission: cfg.maxTipsPerMission,
              dailySpendCap: cfg.dailySpendCap,
            },
          },
          200,
          cors,
        );
      }

      /* ── stats ──────────────────────────────────────────────────────── */
      if (route === 'GET /api/stats') {
        return json(await computeStats(env), 200, cors);
      }

      /* ── jars ───────────────────────────────────────────────────────── */
      if (route === 'GET /api/jars') {
        const jars = await listJars(env, 40);
        return json({ jars }, 200, cors);
      }

      if (req.method === 'POST' && path === '/api/jars') {
        const body = await readJson<{
          input: {
            wallet: string;
            slug: string;
            name: string;
            bio?: string;
            x?: string | null;
            image?: string | null;
            tracks: AudiusTrack[];
          };
          signature?: string;
          timestamp?: number;
        }>(req);

        const input = body.input;
        if (!input || !/^0x[0-9a-fA-F]{40}$/.test(input.wallet || '')) {
          throw new ApiError('A valid wallet address is required', 400, 'BAD_WALLET');
        }
        const slug = assertSlug(input.slug);
        const tracks = assertAudiusTracks(input.tracks);
        const name = String(input.name ?? '').trim().slice(0, 48);
        if (!name) throw new ApiError('Display name is required', 400, 'NO_NAME');

        // ── prove wallet ownership (free signature, no gas) ──
        const timestamp = Number(body.timestamp ?? 0);
        if (!body.signature || !timestamp || Math.abs(Date.now() - timestamp) > 15 * 60_000) {
          throw new ApiError('Signature required (or expired) — sign again', 401, 'SIGNATURE_REQUIRED');
        }
        const message = buildJarMessage({
          wallet: input.wallet,
          slug,
          name,
          trackIds: tracks.map((t) => t.id),
          timestamp,
        });
        const ok = await verifyWalletSignature(input.wallet as `0x${string}`, message, body.signature as `0x${string}`);
        if (!ok) throw new ApiError('Wallet signature did not verify', 401, 'BAD_SIGNATURE');

        // ── slug must be free (or owned by this wallet) ──
        const existingSlugWallet = await env.VIBES_KV.get(`jar:slug:${slug}`);
        if (existingSlugWallet && existingSlugWallet.toLowerCase() !== input.wallet.toLowerCase()) {
          throw new ApiError('That handle is already taken', 409, 'SLUG_TAKEN');
        }

        const existing = await getJar(env, input.wallet);
        const jar: TipJar = {
          wallet: input.wallet,
          slug,
          name,
          bio: String(input.bio ?? '').slice(0, 280),
          x: input.x ? String(input.x).replace(/^@/, '').slice(0, 40) : null,
          image: input.image ? String(input.image).slice(0, 400) : null,
          audiusHandles: Array.from(
            new Set(tracks.map((t) => (t.artistHandle || '').toLowerCase()).filter(Boolean)),
          ),
          tracks,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
          tipCount: existing?.tipCount ?? 0,
          totalReceived: existing?.totalReceived ?? '0',
        };

        await saveJar(env, jar);
        return json({ jar }, 200, cors);
      }

      if (req.method === 'GET' && path.startsWith('/api/jars/')) {
        const id = decodeURIComponent(path.slice('/api/jars/'.length));
        const jar = await findJar(env, id);
        if (!jar) return json({ error: 'Jar not found', code: 'NOT_FOUND' }, 404, cors);
        const tips = await jarTips(env, jar.wallet, 30);
        return json({ jar, tips }, 200, cors);
      }

      /* ── tips ───────────────────────────────────────────────────────── */
      if (route === 'GET /api/tips') {
        const limit = Math.min(50, Number(url.searchParams.get('limit') ?? 12) || 12);
        return json({ tips: await recentTips(env, limit) }, 200, cors);
      }

      if (route === 'POST /api/tips') {
        const body = await readJson<{
          txHash: string;
          to: string;
          amount: string;
          message?: string | null;
          from?: string | null;
        }>(req);

        if (!/^0x[0-9a-fA-F]{64}$/.test(body.txHash ?? '')) {
          throw new ApiError('A valid transaction hash is required', 400, 'BAD_TX');
        }
        if (!/^0x[0-9a-fA-F]{40}$/.test(body.to ?? '')) {
          throw new ApiError('A valid recipient is required', 400, 'BAD_TO');
        }
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount <= 0) throw new ApiError('Invalid amount', 400, 'BAD_AMOUNT');

        const jar = await getJar(env, body.to);
        if (!jar) throw new ApiError('Recipient has no VibeMusic jar', 404, 'NO_JAR');

        // Re-verify the transfer on Base: no fake tips in the feed.
        const from = (body.from ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;
        if (!/^0x[0-9a-fA-F]{40}$/.test(from)) throw new ApiError('A valid sender is required', 400, 'BAD_FROM');

        await verifyHumanTip(env, {
          txHash: body.txHash as `0x${string}`,
          from,
          to: body.to as `0x${string}`,
          amountWei: parseAmount(body.amount),
        });

        // idempotency: don't double-record the same tx
        const existing = await recentTips(env, 100);
        const dupe = existing.find((t) => t.txHash?.toLowerCase() === body.txHash.toLowerCase());
        if (dupe) return json({ tip: dupe }, 200, cors);

        const tip: Tip = {
          id: `tip_${Date.now().toString(36)}`,
          from,
          to: body.to,
          amount: String(amount),
          message: body.message ? String(body.message).slice(0, 200) : null,
          txHash: body.txHash,
          timestamp: Date.now(),
          isAgent: false,
          trackId: jar.tracks?.[0]?.id ?? null,
          trackTitle: jar.tracks?.[0]?.title ?? null,
        };
        await recordTip(env, tip);
        return json({ tip }, 200, cors);
      }

      /* ── agent ──────────────────────────────────────────────────────── */
      if (route === 'GET /api/agent/state') {
        const base = await readAgentState(env);
        return json(await agentConsoleState(env, base), 200, cors);
      }

      if (route === 'GET /api/agent/events') {
        const limit = Math.min(80, Number(url.searchParams.get('limit') ?? 40) || 40);
        const missions = await recentMissions(env, 12);
        return json({ events: eventsFromMissions(missions, limit) }, 200, cors);
      }

      if (route === 'GET /api/agent/missions') {
        const limit = Math.min(20, Number(url.searchParams.get('limit') ?? 10) || 10);
        return json({ missions: await recentMissions(env, limit) }, 200, cors);
      }

      if (route === 'POST /api/agent/run') {
        const body = await readJson<{ prompt?: string }>(req).catch(() => ({ prompt: '' }));
        const prompt = (body.prompt ?? '').trim().slice(0, 240) || 'Tip the best chill tracks right now';
        const mission = await runMission(env, prompt);
        return json({ mission }, 200, cors);
      }

      /**
       * Public agentic-payment endpoint: any external agent can post a signed tip.
       * `/tip-agent` is the alias promised by the VibeMusic architecture spec.
       */
      if (route === 'POST /api/agent/tip' || route === 'POST /tip-agent') {
        const body = await readJson<{
          authorization: any;
          signature: `0x${string}`;
          trackTitle?: string;
          artist?: string;
        }>(req);

        if (!isValidAuthorization(body.authorization)) {
          throw new ApiError('Malformed authorization', 400, 'BAD_AUTH');
        }
        if (!/^0x[0-9a-fA-F]{130}$/.test(body.signature ?? '')) {
          throw new ApiError('Malformed signature', 400, 'BAD_SIGNATURE');
        }

        const tip = await submitTip(env, {
          authorization: body.authorization,
          signature: body.signature,
          trackTitle: body.trackTitle ?? null,
          artist: body.artist ?? null,
        });
        return json({ ok: true, tip }, 200, cors);
      }

      /* ── audius helpers (proxy keeps the browser free of rate-limit pain) ── */
      if (req.method === 'GET' && path === '/api/audius/track') {
        const q = url.searchParams.get('q') ?? '';
        const track = await resolveAudiusInput(q);
        return json({ track }, 200, cors);
      }

      if (req.method === 'GET' && path === '/api/audius/trending') {
        const limit = Math.min(20, Number(url.searchParams.get('limit') ?? 8) || 8);
        const genre = url.searchParams.get('genre') ?? undefined;
        return json({ tracks: await trendingTracks(limit, genre) }, 200, cors);
      }

      return json({ error: `No route for ${route}`, code: 'NOT_FOUND' }, 404, cors);
    } catch (e) {
      return errorResponse(e, cors);
    }
  },

  /**
   * Optional cron: the agent can cook on its own.
   * Enable in wrangler.toml → [triggers] crons = ["0 0,6,12,18 * * *"]
   */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    const prompts = [
      'Tip the best chill tracks right now',
      'Find high-quality electronic tracks and tip the artists',
      'Reward underrated artists with under 5k plays',
    ];
    const prompt = prompts[Math.floor(Date.now() / 3_600_000) % prompts.length];
    ctx.waitUntil(
      runMission(env, prompt).catch((e) => console.error('[vibemusic] cron mission failed', e)),
    );
  },
};

/** "12.5" → 12500000000000000000n without pulling in viem parseUnits twice. */
function parseAmount(amount: string): bigint {
  const [whole, frac = ''] = String(amount).split('.');
  const decimals = 18;
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(padded || '0');
}
