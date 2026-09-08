import { describe, expect, it, vi } from 'vitest';
import type { WebSocketConnection, RealtimeSocketMessage } from './websocket.js';
import { RealtimeGateway } from './gateway.js';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';

class FakeConnection {
  sent: string[] = [];
  closed?: { code: number; reason: string };
  private messageHandler?: (message: RealtimeSocketMessage) => void;
  private closeHandler?: () => void;
  private activityHandler?: () => void;

  onMessage(handler: (message: RealtimeSocketMessage) => void) {
    this.messageHandler = handler;
    return () => undefined;
  }

  onClose(handler: () => void) {
    this.closeHandler = handler;
    return () => undefined;
  }

  onActivity(handler: () => void) {
    this.activityHandler = handler;
    return () => undefined;
  }

  sendText(value: string) {
    this.sent.push(value);
  }

  close(code = 1000, reason = '') {
    this.closed = { code, reason };
    this.closeHandler?.();
  }

  emit(message: RealtimeSocketMessage) {
    this.activityHandler?.();
    this.messageHandler?.(message);
  }
}

const control = (sequence: number, type: 'session.start' | 'audio.start' | 'session.end') => ({
  schemaVersion: '1',
  sessionId,
  eventId: `660e8400-e29b-41d4-a716-${String(sequence).padStart(12, '0')}`,
  sequence,
  timestamp: '2026-09-08T02:00:00.000Z',
  type,
  payload:
    type === 'session.start'
      ? { sourceLanguages: ['fr'], targetLanguage: 'nb' }
      : type === 'audio.start'
        ? { codec: 'pcm_s16le', sampleRate: 16000, channels: 1, frameDurationMs: 20 }
        : { reason: 'test' },
});

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('RealtimeGateway', () => {
  it('binds an authenticated owned session and emits accepted/ready/ended events', async () => {
    const auth = {
      verifyAccessToken: vi.fn(async () => ({ userId: 'user-1' })),
      canAccessSession: vi.fn(async () => true),
    };
    const gateway = new RealtimeGateway(auth, { idleTimeoutMs: 60_000, maxSessionMs: 60_000 });
    const connection = new FakeConnection();
    await expect(
      gateway.attach(connection as unknown as WebSocketConnection, 'token'),
    ).resolves.toBe(true);

    connection.emit({ type: 'text', data: JSON.stringify(control(0, 'session.start')) });
    await settle();
    expect(auth.canAccessSession).toHaveBeenCalledWith('token', sessionId);
    expect(JSON.parse(connection.sent[0]!).type).toBe('session.accepted');

    connection.emit({ type: 'text', data: JSON.stringify(control(1, 'audio.start')) });
    await settle();
    expect(JSON.parse(connection.sent[1]!).type).toBe('audio.ready');

    connection.emit({ type: 'text', data: JSON.stringify(control(2, 'session.end')) });
    await settle();
    expect(JSON.parse(connection.sent[2]!).type).toBe('session.ended');
    expect(connection.closed).toEqual({ code: 1000, reason: 'session_ended' });
  });

  it('rejects a token that cannot be authenticated', async () => {
    const gateway = new RealtimeGateway({
      verifyAccessToken: vi.fn(async () => null),
      canAccessSession: vi.fn(async () => false),
    });
    const connection = new FakeConnection();
    await expect(
      gateway.attach(connection as unknown as WebSocketConnection, 'bad-token'),
    ).resolves.toBe(false);
    expect(connection.closed).toEqual({ code: 1008, reason: 'unauthorized' });
  });
});
