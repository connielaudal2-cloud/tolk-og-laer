import { NativeModule, requireNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';

export type CaptureOptions = { sampleRate: 16000; frameDurationMs: 20 | 40 };
export type AudioFrame = {
  sequence: number;
  timestampMs: number;
  pcmBase64: string;
  levelDbfs: number;
};
export type AudioRoute = { input: string; outputs: string[]; bluetooth: boolean };

type Events = {
  onAudioFrame: (frame: AudioFrame) => void;
  onAudioRouteChanged: (route: AudioRoute) => void;
};

declare class TolkNativeAudioModule extends NativeModule<Events> {
  requestMicrophonePermission(): Promise<boolean>;
  getAudioRoute(): AudioRoute;
  startCapture(options: CaptureOptions): Promise<void>;
  stopCapture(): Promise<void>;
}

const nativeAudio = requireNativeModule<TolkNativeAudioModule>('TolkNativeAudio');

export const requestMicrophonePermission = () => nativeAudio.requestMicrophonePermission();
export const getAudioRoute = () => nativeAudio.getAudioRoute();
export const startCapture = (
  options: CaptureOptions = { sampleRate: 16000, frameDurationMs: 20 },
) => nativeAudio.startCapture(options);
export const stopCapture = () => nativeAudio.stopCapture();
export const addAudioFrameListener = (listener: Events['onAudioFrame']): EventSubscription =>
  nativeAudio.addListener('onAudioFrame', listener);
export const addAudioRouteListener = (listener: Events['onAudioRouteChanged']): EventSubscription =>
  nativeAudio.addListener('onAudioRouteChanged', listener);
