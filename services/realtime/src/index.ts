export { RealtimeSession, reconnectDelayMs, type SessionAction } from './session.js';
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
} from './audio/index.js';

export const realtimeServiceBoundary = {
  transport: 'long-lived-bidirectional',
  controlProtocol: 'typed-json-v1',
  audioProtocol: 'ordered-binary-pcm-v1',
  authentication: 'short-lived-user-scoped-token',
  persistsRawAudio: false,
  netlifyTransport: false,
} as const;
