export { RealtimeSession, reconnectDelayMs, type SessionAction } from './session.js';

export const realtimeServiceBoundary = {
  transport: 'long-lived-bidirectional',
  controlProtocol: 'typed-json-v1',
  audioProtocol: 'ordered-binary-pcm-v1',
  authentication: 'short-lived-user-scoped-token',
  persistsRawAudio: false,
  netlifyTransport: false,
} as const;
