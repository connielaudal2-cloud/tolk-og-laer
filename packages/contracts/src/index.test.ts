import { describe, expect, it } from 'vitest';
import {
  clientControlEvent,
  decodeAudioFrame,
  encodeAudioFrame,
  serverControlEvent,
  speakerLabel,
} from './index.js';

describe('realtime contracts', () => {
  it('rejects unsupported speaker labels', () =>
    expect(speakerLabel.safeParse('Person 4').success).toBe(false));
  const envelope = {
    schemaVersion: '1',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    eventId: '660e8400-e29b-41d4-a716-446655440000',
    sequence: 0,
    timestamp: '2026-08-28T20:00:00.000Z',
  } as const;
  it('validates session start', () =>
    expect(
      clientControlEvent.safeParse({
        ...envelope,
        type: 'session.start',
        payload: { sourceLanguages: ['fr', 'ary'], targetLanguage: 'nb' },
      }).success,
    ).toBe(true));
  it('rejects provider-shaped events', () =>
    expect(
      serverControlEvent.safeParse({ ...envelope, type: 'provider.response', payload: {} }).success,
    ).toBe(false));
  it('round trips binary audio sequence and PCM', () => {
    const decoded = decodeAudioFrame(encodeAudioFrame(42, new Uint8Array([1, 2, 3])));
    expect(decoded.sequence).toBe(42);
    expect([...decoded.pcm]).toEqual([1, 2, 3]);
  });
  it('rejects an empty PCM payload', () =>
    expect(() => decodeAudioFrame(new Uint8Array(4))).toThrow());
});
