/** Tiny HTTP helpers: JSON responses, CORS, typed errors. */

export class ApiError extends Error {
  status: number;
  code?: string;
  extra?: Record<string, unknown>;

  constructor(message: string, status = 400, code?: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function corsHeaders(origin: string | null, allowed: string): Record<string, string> {
  const allowAll = allowed === '*';
  const list = allowed.split(',').map((s) => s.trim()).filter(Boolean);
  const allowOrigin = allowAll ? '*' : origin && list.includes(origin) ? origin : list[0] || '';

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function errorResponse(e: unknown, headers: Record<string, string> = {}): Response {
  if (e instanceof ApiError) {
    return json({ error: e.message, code: e.code, ...(e.extra ?? {}) }, e.status, headers);
  }
  const message = e instanceof Error ? e.message : 'Unexpected error';
  console.error('[vibemusic] unhandled', e);
  return json({ error: message, code: 'INTERNAL' }, 500, headers);
}

export async function readJson<T>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text) throw new ApiError('Empty request body', 400, 'EMPTY_BODY');
  if (text.length > 200_000) throw new ApiError('Payload too large', 413, 'TOO_LARGE');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Invalid JSON body', 400, 'BAD_JSON');
  }
}
