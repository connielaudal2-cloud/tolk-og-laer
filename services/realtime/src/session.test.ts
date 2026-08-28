import { describe, expect, it } from 'vitest';
import { encodeAudioFrame } from '@tolk-og-laer/contracts';
import { RealtimeSession, reconnectDelayMs } from './session.js';

const event = (sequence: number, type: 'session.start' | 'audio.start' | 'audio.stop') => ({
  schemaVersion: '1',
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  eventId: `660e8400-e29b-41d4-a716-${String(sequence).padStart(12, '0')}`,
  sequence,
  timestamp: '2026-08-29T00:00:00.000Z',
  type,
  payload:
    type === 'session.start'
      ? { sourceLanguages: ['fr'], targetLanguage: 'nb' }
      : type === 'audio.start'
        ? { codec: 'pcm_s16le', sampleRate: 16000, channels: 1, frameDurationMs: 20 }
        : {},
});

describe('RealtimeSession', () => {
  it('enforces lifecycle and ordered transient audio', () => {
    const session = new RealtimeSession();
    session.acceptControl(event(0, 'session.start'));
    session.acceptControl(event(1, 'audio.start'));
    expect(session.state).toBe('listening');
    expect(session.acceptAudio(encodeAudioFrame(0, new Uint8Array([1, 2]))).type).toBe('audio');
    expect(session.acceptAudio(encodeAudioFrame(0, new Uint8Array([1, 2]))).type).toBe('duplicate');
    expect(() => session.acceptAudio(encodeAudioFrame(2, new Uint8Array([1, 2])))).toThrow(
      'sequence gap',
    );
  });
  it('rejects audio before audio.start', () =>
    expect(() =>
      new RealtimeSession().acceptAudio(encodeAudioFrame(0, new Uint8Array([1]))),
    ).toThrow());
  it('uses bounded exponential reconnect delays', () => {
    expect(reconnectDelayMs(1, () => 0.5)).toBe(500);
    expect(reconnectDelayMs(20, () => 0.5)).toBe(15000);
  });
});
