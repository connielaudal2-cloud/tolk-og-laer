import { describe, expect, it, vi } from 'vitest';
import { RealtimeTransport } from './realtime';

describe('RealtimeTransport', () => {
  it('rejects insecure non-local transport', () => {
    const transport = new RealtimeTransport({
      url: 'ws://example.com',
      accessToken: 'token',
      onEvent: vi.fn(),
    });
    expect(() => transport.connect()).toThrow('wss://');
  });

  it('drops audio instead of growing the socket buffer past its limit', () => {
    const originalWebSocket = globalThis.WebSocket;
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      value: { OPEN: 1 },
    });
    try {
      const send = vi.fn();
      const onBackpressure = vi.fn();
      const socket = {
        readyState: 1,
        binaryType: 'blob' as BinaryType,
        bufferedAmount: 4097,
        send,
        close: vi.fn(),
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
      };
      const transport = new RealtimeTransport({
        url: 'wss://realtime.example.test',
        accessToken: 'token',
        onEvent: vi.fn(),
        createSocket: () => socket,
        maxBufferedAudioBytes: 4096,
        onBackpressure,
      });
      transport.connect();
      expect(transport.sendAudio(0, new Uint8Array([1, 2]))).toBe(false);
      expect(send).not.toHaveBeenCalled();
      expect(onBackpressure).toHaveBeenCalledWith(4097, 4096);
      socket.bufferedAmount = 0;
      expect(transport.sendAudio(0, new Uint8Array([1, 2]))).toBe(true);
      expect(send).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, 'WebSocket', {
        configurable: true,
        value: originalWebSocket,
      });
    }
  });
});
