import { describe, expect, it, vi } from 'vitest';
import type { ClientControlEvent } from '@tolk-og-laer/contracts';
import {
  TranslatorSessionController,
  type TranslationSessionApiBoundary,
  type TranslatorAudioStream,
  type TranslatorRealtimeTransport,
} from './session-controller';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const eventIds = [
  '660e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440003',
];

const diagnostics = {
  captureFrames: 12,
  sentFrames: 11,
  droppedForBackpressure: 1,
  captureSequenceGaps: 0,
  lastQuality: 'ok' as const,
};

const setup = (streamStart = vi.fn(async () => undefined)) => {
  const api: TranslationSessionApiBoundary = {
    create: vi.fn(async () => ({
      sessionId,
      status: 'starting' as const,
      targetLanguage: 'nb' as const,
      retentionMode: 'none' as const,
    })),
    end: vi.fn(async (_token, id, input) => ({
      sessionId: id,
      status: input.status,
      endedAt: '2026-09-08T02:00:00.000Z',
    })),
  };
  const events: ClientControlEvent[] = [];
  const transport: TranslatorRealtimeTransport = {
    connectAndWait: vi.fn(async () => undefined),
    sendControl: vi.fn((event) => events.push(event)),
    sendAudio: vi.fn(() => true),
    close: vi.fn(),
  };
  const stream: TranslatorAudioStream = {
    start: streamStart,
    stop: vi.fn(async () => undefined),
    getDiagnostics: () => diagnostics,
  };
  let idIndex = 0;
  const controller = new TranslatorSessionController({
    api,
    accessToken: vi.fn(async () => 'access-token'),
    createTransport: () => transport,
    createAudioStream: () => stream,
    createEventId: () => eventIds[idIndex++]!,
    now: () => new Date('2026-09-08T01:00:00.000Z'),
  });
  return { controller, api, transport, stream, events };
};

describe('TranslatorSessionController', () => {
  it('orchestrates backend, realtime controls and native audio in order', async () => {
    const { controller, api, transport, stream, events } = setup();
    await expect(
      controller.start({ sourceLanguages: ['ary', 'fr'], targetLanguage: 'nb', retentionMode: 'none' }),
    ).resolves.toMatchObject({ state: 'listening', sessionId });

    expect(transport.connectAndWait).toHaveBeenCalledBefore(stream.start as ReturnType<typeof vi.fn>);
    expect(events.map((event) => [event.sequence, event.type])).toEqual([
      [0, 'session.start'],
      [1, 'audio.start'],
    ]);

    await expect(controller.stop()).resolves.toMatchObject({
      state: 'ended',
      sessionId,
      diagnostics,
    });
    expect(events.map((event) => [event.sequence, event.type])).toEqual([
      [0, 'session.start'],
      [1, 'audio.start'],
      [2, 'audio.stop'],
      [3, 'session.end'],
    ]);
    expect(api.end).toHaveBeenCalledWith('access-token', sessionId, {
      status: 'ended',
      reason: 'user_requested',
    });
    expect(transport.close).toHaveBeenCalledTimes(1);
  });

  it('marks the backend session failed and closes transport when audio startup fails', async () => {
    const startupError = new Error('native capture failed');
    const { controller, api, transport } = setup(
      vi.fn(async () => {
        throw startupError;
      }),
    );
    await expect(
      controller.start({ sourceLanguages: ['ary'], targetLanguage: 'nb', retentionMode: 'none' }),
    ).rejects.toThrow('native capture failed');
    expect(controller.snapshot().state).toBe('failed');
    expect(transport.close).toHaveBeenCalledTimes(1);
    expect(api.end).toHaveBeenCalledWith('access-token', sessionId, {
      status: 'failed',
      reason: 'startup_failed',
    });
  });
});
