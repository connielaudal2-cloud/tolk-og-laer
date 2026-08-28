import {
  clientControlEvent,
  decodeAudioFrame,
  type ClientControlEvent,
  type TranslatorSessionState,
} from '@tolk-og-laer/contracts';

export type SessionAction =
  | { type: 'control'; event: ClientControlEvent }
  | { type: 'audio'; sequence: number; pcm: Uint8Array }
  | { type: 'duplicate'; sequence: number };

const transitions: Record<
  TranslatorSessionState,
  Partial<Record<ClientControlEvent['type'], TranslatorSessionState>>
> = {
  idle: { 'session.start': 'starting' },
  starting: { 'audio.start': 'listening', 'session.end': 'ended' },
  listening: {
    'audio.stop': 'processing',
    'session.pause': 'degraded',
    'session.end': 'ended',
    'client.heartbeat': 'listening',
  },
  processing: {
    'audio.start': 'listening',
    'session.end': 'ended',
    'client.heartbeat': 'processing',
  },
  degraded: {
    'session.resume': 'reconnecting',
    'session.end': 'ended',
    'client.heartbeat': 'degraded',
  },
  reconnecting: {
    'audio.start': 'listening',
    'session.end': 'ended',
    'client.heartbeat': 'reconnecting',
  },
  ended: {},
  failed: {},
};

export class RealtimeSession {
  state: TranslatorSessionState = 'idle';
  private lastControlSequence = -1;
  private lastAudioSequence = -1;

  acceptControl(input: unknown): SessionAction {
    const event = clientControlEvent.parse(input);
    if (event.sequence <= this.lastControlSequence)
      return { type: 'duplicate', sequence: event.sequence };
    const next = transitions[this.state]![event.type];
    if (!next) throw new Error(`Event ${event.type} is invalid while session is ${this.state}`);
    this.lastControlSequence = event.sequence;
    this.state = next;
    return { type: 'control', event };
  }

  acceptAudio(frame: Uint8Array): SessionAction {
    if (this.state !== 'listening')
      throw new Error(`Audio is invalid while session is ${this.state}`);
    const decoded = decodeAudioFrame(frame);
    if (decoded.sequence <= this.lastAudioSequence)
      return { type: 'duplicate', sequence: decoded.sequence };
    if (decoded.sequence !== this.lastAudioSequence + 1)
      throw new Error(
        `Audio sequence gap: expected ${this.lastAudioSequence + 1}, received ${decoded.sequence}`,
      );
    this.lastAudioSequence = decoded.sequence;
    return { type: 'audio', ...decoded };
  }
}

export const reconnectDelayMs = (attempt: number, random = Math.random): number => {
  if (!Number.isInteger(attempt) || attempt < 1)
    throw new RangeError('Reconnect attempt must be positive');
  return Math.round(Math.min(15_000, 500 * 2 ** (attempt - 1)) * (0.8 + random() * 0.4));
};
