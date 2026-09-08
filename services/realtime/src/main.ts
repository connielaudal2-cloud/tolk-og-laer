import { createRealtimeServer } from './server.js';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const positiveNumber = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number`);
  return value;
};

const port = positiveNumber('PORT', 8080);
const server = createRealtimeServer({
  supabaseUrl: required('SUPABASE_URL'),
  publishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
  heartbeatIntervalMs: positiveNumber('REALTIME_HEARTBEAT_INTERVAL_MS', 20_000),
  idleTimeoutMs: positiveNumber('REALTIME_IDLE_TIMEOUT_SECONDS', 60) * 1000,
  maxSessionMs: positiveNumber('REALTIME_MAX_SESSION_SECONDS', 3600) * 1000,
  maxPayloadBytes: positiveNumber('REALTIME_MAX_PAYLOAD_BYTES', 512 * 1024),
});

server.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ level: 'info', message: 'realtime_started', port }));
});

const shutdown = (signal: string) => {
  console.log(JSON.stringify({ level: 'info', message: 'realtime_stopping', signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
