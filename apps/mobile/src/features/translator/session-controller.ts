import {
  REALTIME_SCHEMA_VERSION,
  type ClientControlEvent,
  type CreateTranslationSessionRequest,
  type CreateTranslationSessionResponse,
  type EndTranslationSessionRequest,
  type EndTranslationSessionResponse,
} from '@tolk-og-laer/contracts';
import type { AudioStreamDiagnostics, AudioTransport } from '../../core/audio/stream';

export type TranslatorControllerState =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'stopping'
  | 'ended'
  | 'failed';

export type TranslationSessionApiBoundary = {
  create(
    accessToken: string,
    input: CreateTranslationSessionRequest,
  ): Promise<CreateTranslationSessionResponse>;
  end(
    accessToken: string,
    sessionId: string,
    input: EndTranslationSessionRequest,
  ): Promise<EndTranslationSessionResponse>;
};

export type TranslatorRealtimeTransport = AudioTransport & {
  connectAndWait(timeoutMs?: number): Promise<void>;
  sendControl(event: ClientControlEvent): void;
  close(): void;
};

export type TranslatorAudioStream = {
  start(): Promise<void>;
  stop(): Promise<void>;
  getDiagnostics(): AudioStreamDiagnostics;
};

export type TranslatorSessionControllerOptions = {
  api: TranslationSessionApiBoundary;
  accessToken: () => Promise<string>;
  createTransport: (accessToken: string) => TranslatorRealtimeTransport;
  createAudioStream: (transport: AudioTransport) => TranslatorAudioStream;
  createEventId: () => string;
  now?: () => Date;
  connectionTimeoutMs?: number;
  onState?: (state: TranslatorControllerState) => void;
};

export type TranslatorSessionSnapshot = {
  state: TranslatorControllerState;
  sessionId: string | null;
  diagnostics: AudioStreamDiagnostics | null;
};

export class TranslatorSessionController {
  private state: TranslatorControllerState = 'idle';
  private sessionId: string | null = null;
  private token: string | null = null;
  private controlSequence = 0;
  private transport: TranslatorRealtimeTransport | null = null;
  private audioStream: TranslatorAudioStream | null = null;
  private sourceLanguages: CreateTranslationSessionRequest['sourceLanguages'] = [];

  constructor(private readonly options: TranslatorSessionControllerOptions) {}

  async start(input: CreateTranslationSessionRequest): Promise<TranslatorSessionSnapshot> {
    if (!['idle', 'ended', 'failed'].includes(this.state))
      throw new Error(`Cannot start translator while state is ${this.state}`);

    this.resetRuntime();
    this.setState('starting');
    try {
      this.token = await this.options.accessToken();
      if (!this.token) throw new Error('Authenticated access token is required');

      const created = await this.options.api.create(this.token, input);
      this.sessionId = created.sessionId;
      this.sourceLanguages = [...input.sourceLanguages];
      this.transport = this.options.createTransport(this.token);
      await this.transport.connectAndWait(this.options.connectionTimeoutMs ?? 10_000);

      this.transport.sendControl(this.sessionStartEvent(input));
      this.transport.sendControl(this.audioStartEvent());

      this.audioStream = this.options.createAudioStream(this.transport);
      await this.audioStream.start();
      this.setState('listening');
      return this.snapshot();
    } catch (error) {
      await this.failStartup();
      throw error;
    }
  }

  async stop(reason = 'user_requested'): Promise<TranslatorSessionSnapshot> {
    if (this.state !== 'listening')
      throw new Error(`Cannot stop translator while state is ${this.state}`);
    this.setState('stopping');

    let firstError: unknown;
    try {
      await this.audioStream?.stop();
    } catch (error) {
      firstError = error;
    }

    try {
      this.transport?.sendControl(this.audioStopEvent());
      this.transport?.sendControl(this.sessionEndEvent(reason));
    } catch (error) {
      firstError ??= error;
    } finally {
      this.transport?.close();
    }

    if (this.token && this.sessionId) {
      try {
        await this.options.api.end(this.token, this.sessionId, { status: 'ended', reason });
      } catch (error) {
        firstError ??= error;
      }
    }

    if (firstError) {
      this.setState('failed');
      throw firstError;
    }
    this.setState('ended');
    return this.snapshot();
  }

  snapshot(): TranslatorSessionSnapshot {
    return {
      state: this.state,
      sessionId: this.sessionId,
      diagnostics: this.audioStream?.getDiagnostics() ?? null,
    };
  }

  private async failStartup() {
    try {
      await this.audioStream?.stop();
    } catch {
      // Best-effort cleanup; original startup failure remains authoritative.
    }
    this.transport?.close();
    if (this.token && this.sessionId) {
      try {
        await this.options.api.end(this.token, this.sessionId, {
          status: 'failed',
          reason: 'startup_failed',
        });
      } catch {
        // Backend cleanup can be retried by operational reconciliation later.
      }
    }
    this.setState('failed');
  }

  private sessionStartEvent(input: CreateTranslationSessionRequest): ClientControlEvent {
    return {
      ...this.envelope(),
      type: 'session.start',
      payload: {
        sourceLanguages: input.sourceLanguages,
        targetLanguage: input.targetLanguage,
      },
    };
  }

  private audioStartEvent(): ClientControlEvent {
    return {
      ...this.envelope(),
      type: 'audio.start',
      payload: { codec: 'pcm_s16le', sampleRate: 16_000, channels: 1, frameDurationMs: 20 },
    };
  }

  private audioStopEvent(): ClientControlEvent {
    return { ...this.envelope(), type: 'audio.stop', payload: {} };
  }

  private sessionEndEvent(reason: string): ClientControlEvent {
    return { ...this.envelope(), type: 'session.end', payload: { reason } };
  }

  private envelope() {
    if (!this.sessionId) throw new Error('Translation session has not been created');
    return {
      schemaVersion: REALTIME_SCHEMA_VERSION,
      sessionId: this.sessionId,
      eventId: this.options.createEventId(),
      sequence: this.controlSequence++,
      timestamp: (this.options.now ?? (() => new Date()))().toISOString(),
    } as const;
  }

  private resetRuntime() {
    this.sessionId = null;
    this.token = null;
    this.controlSequence = 0;
    this.transport = null;
    this.audioStream = null;
    this.sourceLanguages = [];
  }

  private setState(state: TranslatorControllerState) {
    this.state = state;
    this.options.onState?.(state);
  }
}
