import {
  createTranslationSessionRequest,
  createTranslationSessionResponse,
  endTranslationSessionRequest,
  endTranslationSessionResponse,
} from '../../packages/contracts/src/index.js';

declare const Netlify: {
  env: { get(name: string): string | undefined };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const apiError = (status: number, code: string, message: string) =>
  json({ error: { code, message } }, status);

const getServerConfig = () => {
  const url = Netlify.env.get('SUPABASE_URL');
  const publishableKey = Netlify.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!url || !publishableKey) throw new Error('Supabase server configuration is missing');
  return { url: url.replace(/\/$/, ''), publishableKey };
};

const supabaseHeaders = (request: Request) => {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const { publishableKey } = getServerConfig();
  return {
    apikey: publishableKey,
    authorization,
    'content-type': 'application/json',
    prefer: 'return=representation',
  };
};

const parseJson = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

const createSession = async (request: Request) => {
  const headers = supabaseHeaders(request);
  if (!headers) return apiError(401, 'unauthorized', 'A valid Bearer token is required');
  const parsed = createTranslationSessionRequest.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(400, 'invalid_request', 'Invalid translation session request');

  const { url } = getServerConfig();
  const upstream = await fetch(
    `${url}/rest/v1/translator_sessions?select=id,status,target_language_code,retention_mode`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        target_language_code: parsed.data.targetLanguage,
        retention_mode: parsed.data.retentionMode,
      }),
    },
  );
  if (upstream.status === 401 || upstream.status === 403)
    return apiError(401, 'unauthorized', 'Authentication failed');
  if (!upstream.ok) return apiError(502, 'session_create_failed', 'Could not create translation session');

  const rows = (await upstream.json()) as unknown;
  if (!Array.isArray(rows) || rows.length !== 1)
    return apiError(502, 'invalid_upstream_response', 'Unexpected session response');
  const row = rows[0] as Record<string, unknown>;
  const response = createTranslationSessionResponse.safeParse({
    sessionId: row.id,
    status: row.status,
    targetLanguage: row.target_language_code,
    retentionMode: row.retention_mode,
  });
  if (!response.success)
    return apiError(502, 'invalid_upstream_response', 'Unexpected session response');
  return json(response.data, 201);
};

const endSession = async (request: Request, sessionId: string) => {
  const headers = supabaseHeaders(request);
  if (!headers) return apiError(401, 'unauthorized', 'A valid Bearer token is required');
  const parsed = endTranslationSessionRequest.safeParse(await parseJson(request));
  if (!parsed.success) return apiError(400, 'invalid_request', 'Invalid session end request');

  const { url } = getServerConfig();
  const endedAt = new Date().toISOString();
  const upstream = await fetch(
    `${url}/rest/v1/translator_sessions?id=eq.${encodeURIComponent(sessionId)}&select=id,status,ended_at`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: parsed.data.status, ended_at: endedAt }),
    },
  );
  if (upstream.status === 401 || upstream.status === 403)
    return apiError(401, 'unauthorized', 'Authentication failed');
  if (!upstream.ok) return apiError(502, 'session_end_failed', 'Could not end translation session');
  const rows = (await upstream.json()) as unknown;
  if (!Array.isArray(rows) || rows.length !== 1) return apiError(404, 'session_not_found', 'Session not found');
  const row = rows[0] as Record<string, unknown>;
  const response = endTranslationSessionResponse.safeParse({
    sessionId: row.id,
    status: row.status,
    endedAt: row.ended_at,
  });
  if (!response.success)
    return apiError(502, 'invalid_upstream_response', 'Unexpected session response');
  return json(response.data);
};

export default async (request: Request) => {
  try {
    const url = new URL(request.url);
    const base = '/v1/translation/sessions';
    if (url.pathname === base && request.method === 'POST') return createSession(request);
    if (url.pathname.startsWith(`${base}/`) && request.method === 'PATCH') {
      const sessionId = url.pathname.slice(base.length + 1);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId))
        return apiError(400, 'invalid_session_id', 'Invalid session id');
      return endSession(request, sessionId);
    }
    return apiError(404, 'not_found', 'Route not found');
  } catch {
    return apiError(500, 'internal_error', 'Internal server error');
  }
};

export const config = {
  path: ['/v1/translation/sessions', '/v1/translation/sessions/:sessionId'],
};
