import {
  AudioPreprocessingPipeline,
  type AudioQuality,
  type ProcessedAudioFrame,
} from '@tolk-og-laer/contracts';
import {
  addAudioFrameListener,
  startCapture,
  stopCapture,
  type AudioFrame,
  type CaptureOptions,
} from '@tolk-og-laer/native-audio';

export type AudioFrameSubscription = { remove(): void };
export type NativeCaptureAdapter = {
  addFrameListener(listener: (frame: AudioFrame) => void): AudioFrameSubscription;
  start(options: CaptureOptions): Promise<void>;
  stop(): Promise<void>;
};
export type AudioTransport = {
  sendAudio(sequence: number, pcm: Uint8Array): boolean;
};
export type AudioStreamDiagnostics = {
  captureFrames: number;
  sentFrames: number;
  droppedForBackpressure: number;
  captureSequenceGaps: number;
  lastQuality: AudioQuality | null;
};
export type AudioStreamFrameReport = {
  nativeSequence: number;
  wireSequence: number | null;
  sent: boolean;
  processed: ProcessedAudioFrame;
  diagnostics: AudioStreamDiagnostics;
};
export type NativeAudioStreamOptions = {
  transport: AudioTransport;
  capture?: NativeCaptureAdapter;
  processor?: AudioPreprocessingPipeline;
  captureOptions?: CaptureOptions;
  onFrame?: (report: AudioStreamFrameReport) => void;
  onCaptureGap?: (expected: number, received: number) => void;
};

const defaultCapture: NativeCaptureAdapter = {
  addFrameListener: addAudioFrameListener,
  start: startCapture,
  stop: stopCapture,
};

export const decodeBase64Pcm = (value: string): Uint8Array => {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

export class NativeAudioStream {
  private readonly capture: NativeCaptureAdapter;
  private readonly processor: AudioPreprocessingPipeline;
  private subscription?: AudioFrameSubscription;
  private running = false;
  private lastNativeSequence: number | null = null;
  private nextWireSequence = 0;
  private diagnostics: AudioStreamDiagnostics = {
    captureFrames: 0,
    sentFrames: 0,
    droppedForBackpressure: 0,
    captureSequenceGaps: 0,
    lastQuality: null,
  };

  constructor(private readonly options: NativeAudioStreamOptions) {
    this.capture = options.capture ?? defaultCapture;
    this.processor = options.processor ?? new AudioPreprocessingPipeline();
  }

  async start() {
    if (this.running) throw new Error('Native audio stream is already running');
    this.resetSession();
    this.subscription = this.capture.addFrameListener((frame) => this.handleFrame(frame));
    try {
      await this.capture.start(
        this.options.captureOptions ?? { sampleRate: 16000, frameDurationMs: 20 },
      );
      this.running = true;
    } catch (error) {
      this.subscription.remove();
      this.subscription = undefined;
      throw error;
    }
  }

  async stop() {
    if (!this.subscription && !this.running) return;
    try {
      if (this.running) await this.capture.stop();
    } finally {
      this.subscription?.remove();
      this.subscription = undefined;
      this.running = false;
      this.processor.reset();
    }
  }

  getDiagnostics(): AudioStreamDiagnostics {
    return { ...this.diagnostics };
  }

  private handleFrame(frame: AudioFrame) {
    const expected = this.lastNativeSequence === null ? frame.sequence : this.lastNativeSequence + 1;
    if (frame.sequence !== expected) {
      this.diagnostics.captureSequenceGaps += 1;
      this.options.onCaptureGap?.(expected, frame.sequence);
    }
    this.lastNativeSequence = frame.sequence;
    this.diagnostics.captureFrames += 1;

    const processed = this.processor.process(decodeBase64Pcm(frame.pcmBase64));
    this.diagnostics.lastQuality = processed.quality;
    const wireSequence = this.nextWireSequence;
    const sent = this.options.transport.sendAudio(wireSequence, processed.pcm);
    if (sent) {
      this.nextWireSequence += 1;
      this.diagnostics.sentFrames += 1;
    } else {
      this.diagnostics.droppedForBackpressure += 1;
    }
    this.options.onFrame?.({
      nativeSequence: frame.sequence,
      wireSequence: sent ? wireSequence : null,
      sent,
      processed,
      diagnostics: this.getDiagnostics(),
    });
  }

  private resetSession() {
    this.processor.reset();
    this.lastNativeSequence = null;
    this.nextWireSequence = 0;
    this.diagnostics = {
      captureFrames: 0,
      sentFrames: 0,
      droppedForBackpressure: 0,
      captureSequenceGaps: 0,
      lastQuality: null,
    };
  }
}
