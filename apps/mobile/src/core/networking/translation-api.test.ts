import { describe, expect, it, vi } from 'vitest';
import { TranslationApiError, TranslationSessionApi } from './translation-api';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';

describe('TranslationSessionApi', () => {
  it('creates a validated authenticated session', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer token');
      return new Response(
        JSON.stringify({
          sessionId,
          status: 'starting',
          targetLanguage: 'nb',
          retentionMode: 'none',
        }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      );
    });
    const api = new TranslationSessionApi('https://api.example.test', fetcher as typeof fetch);
    await expect(
      api.create('token', { sourceLanguages: ['ary'], targetLanguage: 'nb', retentionMode: 'none' }),
    ).resolves.toMatchObject({ sessionId, status: 'starting' });
  });

  it('surfaces typed API errors', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: 'unauthorized', message: 'No access' } }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const api = new TranslationSessionApi('https://api.example.test', fetcher as typeof fetch);
    await expect(
      api.create('token', { sourceLanguages: ['fr'], targetLanguage: 'nb', retentionMode: 'none' }),
    ).rejects.toEqual(expect.objectContaining<Partial<TranslationApiError>>({ status: 401, code: 'unauthorized' }));
  });
});
