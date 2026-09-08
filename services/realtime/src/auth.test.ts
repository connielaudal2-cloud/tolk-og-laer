import { describe, expect, it, vi } from 'vitest';
import { SupabaseRealtimeAuth } from './auth.js';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';

describe('SupabaseRealtimeAuth', () => {
  it('verifies users with the public key and bearer token', async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>).apikey).toBe('publishable');
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer token');
      return new Response(JSON.stringify({ id: 'user-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const auth = new SupabaseRealtimeAuth({
      supabaseUrl: 'https://example.supabase.co',
      publishableKey: 'publishable',
      fetcher: fetcher as typeof fetch,
    });
    await expect(auth.verifyAccessToken('token')).resolves.toEqual({ userId: 'user-1' });
  });

  it('uses RLS when authorizing translation sessions', async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify([{ id: sessionId }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const auth = new SupabaseRealtimeAuth({
      supabaseUrl: 'https://example.supabase.co/',
      publishableKey: 'publishable',
      fetcher: fetcher as typeof fetch,
    });
    await expect(auth.canAccessSession('token', sessionId)).resolves.toBe(true);
    expect(String(fetcher.mock.calls[0]?.[0])).toContain(`id=eq.${sessionId}`);
  });
});
