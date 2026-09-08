import { randomUUID } from 'node:crypto';
import {
  clientControlEvent,
  type ClientControlEvent,
  type ServerControlEvent,
} from '@tolk-og-laer/contracts';
import { RealtimeSession } from './session.js';
import type { RealtimeIdentity } from './auth.js';
import type { RealtimeSocketMessage, WebSocketConnection } from './websocket.js';

export type RealtimeGatewayAuth = {
  verifyAccessToken(accessToken: string): Promise<RealtimeIdentity | null>;
  canAccessSession(accessToken: string, sessionId: string): Promise<boolean>;
};

export type RealtimeGatewayOptions = {
  heartbeatIntervalMs?: number;
  idleTimeoutMs?: number;
  maxSessionMs?: number;
};

export class RealtimeGateway {
  private readonly heartbeatIntervalMs: number;
  private readonly idleTimeoutMs: number;
  private readonly maxSessionMs: number;

  constructor(
    private readonly auth: RealtimeGatewayAuth,
    options: RealtimeGatewayOptions = {},
  ) {
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 20_000;
    this.idleTimeoutMs = options.idleTimeoutMs ?? 60_000;
    this.maxSessionMs = options.maxSessionMs ?? 3_600_000;
  }

  async attach(connection: WebSocketConnection, accessToken: string): Promise<boolean> {
    const identity = await this.auth.verifyAccessToken(accessToken);
    if (!identity) {
      connection.close(1008, 'unauthorized');
      return false;
    }

    const session = new RealtimeSession();
    let boundSessionId: string | undefined;
    let serverSequence = 0;
    let lastActivityAt = Date.now();
    let processing = Promise.resolve();
    let closed = false;

    const send = (event: Omit<ServerControlEvent, 'schemaVersion' | 'eventId' | 'sequence' | 'timestamp'>) => {
      if (!boundSessionId || closed) return;
      const envelope = {
        ...event,
        schemaVersion: '1' as const,
        sessionId: boundSessionId,
        eventId: randomUUID(),
        sequence: serverSequence++,
        timestamp: new Date().toISOString(),
      } satisfies ServerControlEvent;
      connection.sendText(JSON.stringify(envelope));
    };

    const fail = (code: string, message: string, retryable = false) => {
      if (boundSessionId) {
        send({
          type: 'session.error',
          payload: { code, message, retryable, requestId: randomUUID() },
        });
      }
      connection.close(1008, code);
    };

    const handleControl = async (input: unknown) => {
      const event = clientControlEvent.parse(input);
      if (!boundSessionId) {
        if (event.type !== 'session.start') throw new Error('session.start must be the first control event');
        if (!(await this.auth.canAccessSession(accessToken, event.sessionId)))
          throw new Error('session_not_authorized');
        boundSessionId = event.sessionId;
      } else if (event.sessionId !== boundSessionId) {
        throw new Error('session_id_mismatch');
      }

      const action = session.acceptControl(event);
      if (action.type === 'duplicate') return;
      const accepted = action.event;
      if (accepted.type === 'session.start') {
        send({
          type: 'session.accepted',
          payload: { resumeToken: randomUUID(), heartbeatIntervalMs: this.heartbeatIntervalMs },
        });
      } else if (accepted.type === 'audio.start') {
        send({ type: 'audio.ready', payload: accepted.payload });
      } else if (accepted.type === 'session.end') {
        send({ type: 'session.ended', payload: { reason: accepted.payload.reason ?? 'client_requested' } });
        connection.close(1000, 'session_ended');
      }
    };

    const handleMessage = async (message: RealtimeSocketMessage) => {
      lastActivityAt = Date.now();
      if (message.type === 'text') {
        let parsed: unknown;
        try {
          parsed = JSON.parse(message.data);
        } catch {
          throw new Error('invalid_json');
        }
        await handleControl(parsed);
      } else {
        const action = session.acceptAudio(message.data);
        if (action.type === 'audio') {
          // Raw audio remains transient. Downstream provider adapters will consume this action.
          void action.pcm;
        }
      }
    };

    connection.onMessage((message) => {
      processing = processing
        .then(() => handleMessage(message))
        .catch((error: unknown) => {
          const messageText = error instanceof Error ? error.message : 'unknown_realtime_error';
          fail('realtime_protocol_error', messageText, false);
        });
    });
    connection.onClose(() => {
      closed = true;
      clearInterval(idleTimer);
      clearTimeout(maxSessionTimer);
    });

    const idleTimer = setInterval(() => {
      if (Date.now() - lastActivityAt > this.idleTimeoutMs) connection.close(1001, 'idle_timeout');
    }, Math.min(this.heartbeatIntervalMs, this.idleTimeoutMs));
    idleTimer.unref?.();
    const maxSessionTimer = setTimeout(() => connection.close(1000, 'max_session_duration'), this.maxSessionMs);
    maxSessionTimer.unref?.();
    return true;
  }
}
