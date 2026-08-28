import { describe, expect, it } from 'vitest';
import { createTolkOgLaerClient } from './index.js';

describe('Supabase client configuration', () => {
  it('rejects missing public configuration', () => {
    expect(() => createTolkOgLaerClient({ url: '', publishableKey: '' })).toThrow(
      'Supabase URL and publishable key are required',
    );
  });
});
