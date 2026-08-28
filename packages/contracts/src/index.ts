import { z } from 'zod';

export const schemaVersion = z.literal('1');
export const sessionId = z.string().uuid();
export const sequenceNumber = z.number().int().nonnegative();
export const speakerLabel = z.enum(['Person 1', 'Person 2', 'Person 3']);
export const supportedSourceLanguage = z.enum(['fr', 'ary']);

export const realtimeEnvelope = z.object({
  schemaVersion,
  sessionId,
  sequence: sequenceNumber,
  timestamp: z.string().datetime(),
});

export const clientEventType = z.enum([
  'session.start',
  'audio.start',
  'audio.chunk',
  'audio.stop',
  'session.pause',
  'session.resume',
  'session.end',
  'client.heartbeat',
]);

export const serverEventType = z.enum([
  'session.accepted',
  'audio.ready',
  'speaker.detected',
  'language.detected',
  'transcript.partial',
  'transcript.final',
  'translation.partial',
  'translation.final',
  'tts.started',
  'tts.ended',
  'session.degraded',
  'session.reconnecting',
  'session.error',
  'session.ended',
]);

export type SpeakerLabel = z.infer<typeof speakerLabel>;
export type ClientEventType = z.infer<typeof clientEventType>;
export type ServerEventType = z.infer<typeof serverEventType>;
