import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';
export { processLock } from '@supabase/supabase-js';
import type { Database } from '@tolk-og-laer/database';

export type TolkOgLaerClient = SupabaseClient<Database>;

export interface SupabaseClientConfig {
  url: string;
  publishableKey: string;
  options?: SupabaseClientOptions<'public'>;
}

export function createTolkOgLaerClient(config: SupabaseClientConfig): TolkOgLaerClient {
  if (!config.url || !config.publishableKey) {
    throw new Error('Supabase URL and publishable key are required');
  }

  return createClient<Database>(config.url, config.publishableKey, config.options);
}

export async function signInWithEmail(client: TolkOgLaerClient, email: string, password: string) {
  return client.auth.signInWithPassword({ email, password });
}

export async function requestMagicLink(client: TolkOgLaerClient, email: string) {
  return client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'tolk-og-laer://auth/callback' },
  });
}

export async function signOut(client: TolkOgLaerClient) {
  return client.auth.signOut();
}
