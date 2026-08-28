import { describe, expect, it, vi } from 'vitest';
import { RealtimeTransport } from './realtime';

describe('RealtimeTransport security boundary', () => {
  it('rejects insecure non-local transport', () => {
    const transport = new RealtimeTransport({
      url: 'ws://example.com',
      accessToken: 'token',
      onEvent: vi.fn(),
    });
    expect(() => transport.connect()).toThrow('wss://');
  });
});
