export interface NativeAudioBridge {
  requestMicrophonePermission(): Promise<boolean>;
  startCapture(): Promise<void>;
  stopCapture(): Promise<void>;
}
