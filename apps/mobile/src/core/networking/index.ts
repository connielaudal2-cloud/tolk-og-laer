export type ConnectionState = 'offline' | 'connecting' | 'connected' | 'degraded' | 'reconnecting';
export {
  RealtimeTransport,
  type RealtimeTransportOptions,
  type RealtimeTransportStatus,
} from './realtime';
