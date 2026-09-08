export { RealtimeSession, reconnectDelayMs, type SessionAction } from './session.js';
export { SupabaseRealtimeAuth, type RealtimeAuthConfig, type RealtimeIdentity } from './auth.js';
export { RealtimeGateway, type RealtimeGatewayAuth, type RealtimeGatewayOptions } from './gateway.js';
export { createRealtimeServer, type RealtimeServerConfig } from './server.js';
export {
  WebSocketConnection,
  acceptWebSocket,
  extractRealtimeAccessToken,
  type RealtimeSocketMessage,
} from './websocket.js';
export {
  AdaptiveEnergyVad,
  AudioPreprocessingPipeline,
  Pcm16DcBlocker,
  analyzePcm16Le,
  classifyQuality,
  defaultDcBlockerConfig,
  defaultVadConfig,
  type AudioMetrics,
  type AudioQuality,
  type DcBlockerConfig,
  type ProcessedAudioFrame,
  type VadConfig,
  type VadDecision,
  type VadState,
} from '@tolk-og-laer/contracts';

export const realtimeServiceBoundary = {
  transport: 'long-lived-bidirectional',
  controlProtocol: 'typed-json-v1',
  audioProtocol: 'ordered-binary-pcm-v1',
  authentication: 'short-lived-user-scoped-token',
  persistsRawAudio: false,
  netlifyTransport: false,
} as const;
