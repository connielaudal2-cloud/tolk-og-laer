import { createServer, type Server } from 'node:http';
import type { Socket } from 'node:net';
import { SupabaseRealtimeAuth } from './auth.js';
import { RealtimeGateway } from './gateway.js';
import { acceptWebSocket, extractRealtimeAccessToken } from './websocket.js';

export type RealtimeServerConfig = {
  supabaseUrl: string;
  publishableKey: string;
  heartbeatIntervalMs?: number;
  idleTimeoutMs?: number;
  maxSessionMs?: number;
  maxPayloadBytes?: number;
};

const reject = (socket: Socket, status: 400 | 401, message: string) => {
  const statusText = status === 401 ? 'Unauthorized' : 'Bad Request';
  socket.end(
    `HTTP/1.1 ${status} ${statusText}\r\nConnection: close\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`,
  );
};

export const createRealtimeServer = (config: RealtimeServerConfig): Server => {
  const auth = new SupabaseRealtimeAuth({
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.publishableKey,
  });
  const gateway = new RealtimeGateway(auth, {
    ...(config.heartbeatIntervalMs !== undefined
      ? { heartbeatIntervalMs: config.heartbeatIntervalMs }
      : {}),
    ...(config.idleTimeoutMs !== undefined ? { idleTimeoutMs: config.idleTimeoutMs } : {}),
    ...(config.maxSessionMs !== undefined ? { maxSessionMs: config.maxSessionMs } : {}),
  });

  const server = createServer((request, response) => {
    if (request.url === '/healthz') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: true, service: 'tolk-og-laer-realtime' }));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'not_found' }));
  });

  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/v1/realtime') {
      reject(socket, 400, 'Unsupported realtime path');
      return;
    }
    const accessToken = extractRealtimeAccessToken(request);
    if (!accessToken) {
      reject(socket, 401, 'Authentication is required');
      return;
    }

    void auth
      .verifyAccessToken(accessToken)
      .then((identity) => {
        if (!identity) {
          reject(socket, 401, 'Authentication failed');
          return;
        }
        const connection = acceptWebSocket(request, socket, head, config.maxPayloadBytes);
        if (!connection) return;
        // Gateway performs the same verification again by design so it remains safe when used by other adapters.
        void gateway.attach(connection, accessToken);
      })
      .catch(() => reject(socket, 401, 'Authentication failed'));
  });

  return server;
};
