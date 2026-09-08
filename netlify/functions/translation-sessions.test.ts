import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './translation-sessions.mjs';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';

const request = (path: string, method: string, body?: unknown, authorized = true) =>
  new Request(`https://tolk-og-laer.test${path}`, {
    method,
    headers: {
      ...(authorized ? { authorization: 'Bearer user-token' } : {}),
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('translation sessions function', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const stubEnvironment = () =>
    vi.stubGlobal('Netlify', {
      env: {
        get: (name: string) =>
          ({
            SUPABASE_URL: 'https://example.supabase.co',
            SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
          })[name],
      },
    });

  it('requires bearer authentication before touching Supabase', async () => {
    stubEnvironment();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(
      request(
        '/v1/translation/sessions',
        'POST',
        { sourceLanguages: ['ary'], targetLanguage: 'nb', retentionMode: 'none' },
        false,
      ),
    );
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates an owner-scoped session through Supabase RLS', async () => {
    stubEnvironment();
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            id: sessionId,
            status: 'starting',
            target_language_code: 'nb',
            retention_mode: 'none',
          },
        ]),
        { status: 201, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(
      request('/v1/translation/sessions', 'POST', {
        sourceLanguages: ['ary', 'fr'],
        targetLanguage: 'nb',
        retentionMode: 'none',
      }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      sessionId,
      status: 'starting',
      targetLanguage: 'nb',
      retentionMode: 'none',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({
      apikey: 'publishable-key',
      authorization: 'Bearer user-token',
    });
  });

  it('ends a session without allowing ownership bypass', async () => {
    stubEnvironment();
    const endedAt = '2026-09-08T01:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(endedAt);
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ id: sessionId, status: 'ended', ended_at: endedAt }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(
      request(`/v1/translation/sessions/${sessionId}`, 'PATCH', {
        status: 'ended',
        reason: 'user_requested',
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ sessionId, status: 'ended', endedAt });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
