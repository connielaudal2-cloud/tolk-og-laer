import { describe, expect, it } from 'vitest';
import { realtimeEnvelope, speakerLabel } from './index.js';

describe('realtime contracts', () => {
  it('rejects unsupported speaker labels', () =>
    expect(speakerLabel.safeParse('Person 4').success).toBe(false));
  it('accepts a valid envelope', () =>
    expect(
      realtimeEnvelope.safeParse({
        schemaVersion: '1',
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        sequence: 0,
        timestamp: '2026-08-28T20:00:00.000Z',
      }).success,
    ).toBe(true));
});
