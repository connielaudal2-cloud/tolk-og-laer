import {
  addAudioFrameListener,
  startCapture,
  stopCapture,
} from '@tolk-og-laer/native-audio';
import {
  NativeAudioStream,
  type NativeAudioStreamOptions,
  type NativeCaptureAdapter,
} from './stream';

const nativeCaptureAdapter: NativeCaptureAdapter = {
  addFrameListener: addAudioFrameListener,
  start: startCapture,
  stop: stopCapture,
};

export type NativeRuntimeAudioStreamOptions = Omit<NativeAudioStreamOptions, 'capture'>;

export const createNativeAudioStream = (
  options: NativeRuntimeAudioStreamOptions,
): NativeAudioStream =>
  new NativeAudioStream({
    ...options,
    capture: nativeCaptureAdapter,
  });
