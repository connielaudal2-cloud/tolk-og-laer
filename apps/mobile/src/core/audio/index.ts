export {
  getAudioRoute,
  requestMicrophonePermission,
  startCapture,
  stopCapture,
  addAudioFrameListener,
  addAudioRouteListener,
  type AudioFrame,
  type AudioRoute,
  type CaptureOptions,
} from '@tolk-og-laer/native-audio';

export {
  NativeAudioStream,
  decodeBase64Pcm,
  type AudioFrameSubscription,
  type AudioStreamDiagnostics,
  type AudioStreamFrameReport,
  type AudioTransport,
  type NativeAudioStreamOptions,
  type NativeCaptureAdapter,
} from './stream';
export {
  createNativeAudioStream,
  type NativeRuntimeAudioStreamOptions,
} from './native-stream';
