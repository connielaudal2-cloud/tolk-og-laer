import { z } from 'zod';

export const REALTIME_SCHEMA_VERSION = '1' as const;
export const schemaVersion = z.literal(REALTIME_SCHEMA_VERSION);
export const sessionId = z.string().uuid();
export const sequenceNumber = z.number().int().nonnegative();
export const speakerLabel = z.enum(['Person 1', 'Person 2', 'Person 3']);
export const supportedSourceLanguage = z.enum(['fr', 'ary']);
export const translatorSessionState = z.enum([
  'idle',
  'starting',
  'listening',
  'processing',
  'degraded',
  'reconnecting',
  'ended',
  'failed',
]);

export const audioFormat = z.object({
  codec: z.literal('pcm_s16le'),
  sampleRate: z.literal(16_000),
  channels: z.literal(1),
  frameDurationMs: z.union([z.literal(20), z.literal(40)]),
});

export const realtimeEnvelope = z.object({
  schemaVersion,
  sessionId,
  sequence: sequenceNumber,
  timestamp: z.string().datetime(),
});

const clientEventBase = realtimeEnvelope.extend({ eventId: z.string().uuid() });
export const clientControlEvent = z.discriminatedUnion('type', [
  clientEventBase.extend({
    type: z.literal('session.start'),
    payload: z.object({
      sourceLanguages: z.array(supportedSourceLanguage).min(1),
      targetLanguage: z.literal('nb'),
    }),
  }),
  clientEventBase.extend({ type: z.literal('audio.start'), payload: audioFormat }),
  clientEventBase.extend({ type: z.literal('audio.stop'), payload: z.object({}) }),
  clientEventBase.extend({ type: z.literal('session.pause'), payload: z.object({}) }),
  clientEventBase.extend({ type: z.literal('session.resume'), payload: z.object({}) }),
  clientEventBase.extend({
    type: z.literal('session.end'),
    payload: z.object({ reason: z.string().max(120).optional() }),
  }),
  clientEventBase.extend({
    type: z.literal('client.heartbeat'),
    payload: z.object({ lastServerSequence: sequenceNumber }),
  }),
]);

const serverEventBase = realtimeEnvelope.extend({ eventId: z.string().uuid() });
const textPayload = z.object({ text: z.string(), confidence: z.number().min(0).max(1).nullable() });
export const serverControlEvent = z.discriminatedUnion('type', [
  serverEventBase.extend({
    type: z.literal('session.accepted'),
    payload: z.object({
      resumeToken: z.string().min(16),
      heartbeatIntervalMs: z.number().int().positive(),
    }),
  }),
  serverEventBase.extend({ type: z.literal('audio.ready'), payload: audioFormat }),
  serverEventBase.extend({
    type: z.literal('speaker.detected'),
    payload: z.object({
      speaker: speakerLabel,
      confidence: z.number().min(0).max(1),
      uncertain: z.boolean(),
    }),
  }),
  serverEventBase.extend({
    type: z.literal('language.detected'),
    payload: z.object({
      language: supportedSourceLanguage,
      confidence: z.number().min(0).max(1),
      revised: z.boolean(),
    }),
  }),
  serverEventBase.extend({ type: z.literal('transcript.partial'), payload: textPayload }),
  serverEventBase.extend({ type: z.literal('transcript.final'), payload: textPayload }),
  serverEventBase.extend({ type: z.literal('translation.partial'), payload: textPayload }),
  serverEventBase.extend({ type: z.literal('translation.final'), payload: textPayload }),
  serverEventBase.extend({
    type: z.literal('tts.started'),
    payload: z.object({ segmentId: z.string().uuid() }),
  }),
  serverEventBase.extend({
    type: z.literal('tts.ended'),
    payload: z.object({ segmentId: z.string().uuid(), interrupted: z.boolean() }),
  }),
  serverEventBase.extend({
    type: z.literal('session.degraded'),
    payload: z.object({ code: z.string(), retryable: z.boolean() }),
  }),
  serverEventBase.extend({
    type: z.literal('session.reconnecting'),
    payload: z.object({
      attempt: z.number().int().positive(),
      delayMs: z.number().int().nonnegative(),
    }),
  }),
  serverEventBase.extend({
    type: z.literal('session.error'),
    payload: z.object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
      requestId: z.string().uuid(),
    }),
  }),
  serverEventBase.extend({
    type: z.literal('session.ended'),
    payload: z.object({ reason: z.string() }),
  }),
]);

// Wire format: 4-byte unsigned big-endian sequence followed by transient PCM bytes.
export const encodeAudioFrame = (sequence: number, pcm: Uint8Array): Uint8Array => {
  if (!Number.isSafeInteger(sequence) || sequence < 0 || sequence > 0xffff_ffff)
    throw new RangeError('Invalid audio sequence');
  const frame = new Uint8Array(4 + pcm.byteLength);
  new DataView(frame.buffer).setUint32(0, sequence, false);
  frame.set(pcm, 4);
  return frame;
};

export const decodeAudioFrame = (frame: Uint8Array) => {
  if (frame.byteLength <= 4)
    throw new RangeError('Audio frame must include header and PCM payload');
  return {
    sequence: new DataView(frame.buffer, frame.byteOffset, 4).getUint32(0, false),
    pcm: frame.subarray(4),
  };
};

export type SpeakerLabel = z.infer<typeof speakerLabel>;
export type TranslatorSessionState = z.infer<typeof translatorSessionState>;
export type AudioFormat = z.infer<typeof audioFormat>;
export type ClientControlEvent = z.infer<typeof clientControlEvent>;
export type ServerControlEvent = z.infer<typeof serverControlEvent>;
