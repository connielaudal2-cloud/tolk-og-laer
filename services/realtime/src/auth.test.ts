import { describe, expect, it, vi } from 'vitest';
import { SupabaseRealtimeAuth } from './auth.js';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';

describe('SupabaseRealtimeAuth', () => {
  it('verifies users with the public key and bearer token', async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>).apikey).toBe('publishable');
      return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 });
    });
    const auth = new SupabaseRealtimeAuth({
      supabaseUrl: 'https://example.supabase.co',
      publishableKey: 'publishable',
      fetcher: fetcher as typeof fetch,
    });
    await expect(auth.verifyAccessToken('token')).resolves.toEqual({ userId: 'user-1' });
  });

  it('uses RLS when authorizing translation sessions', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
      expect(String(input)).toContain(`id=eq.${sessionId}`);
      return new Response(JSON.stringify([{ id: sessionId }]), { status: 200 });
    });
    const auth = new SupabaseRealtimeAuth({
      supabaseUrl: 'https://example.supabase.co/',
      publishableKey: 'publishable',
      fetcher: fetcher as typeof fetch,
    });
    await expect(auth.canAccessSession('token', sessionId)).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
