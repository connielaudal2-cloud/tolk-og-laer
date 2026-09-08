export type AudioMetrics = {
  sampleCount: number;
  rms: number;
  peak: number;
  dbfs: number;
  clippingRatio: number;
  dcOffset: number;
};

const INT16_SCALE = 32768;

export const analyzePcm16Le = (pcm: Uint8Array): AudioMetrics => {
  if (pcm.byteLength === 0 || pcm.byteLength % 2 !== 0)
    throw new RangeError('PCM16 frame must contain a non-zero even number of bytes');
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const sampleCount = pcm.byteLength / 2;
  let sumSquares = 0;
  let peak = 0;
  let clipped = 0;
  let sum = 0;
  for (let offset = 0; offset < pcm.byteLength; offset += 2) {
    const sample = view.getInt16(offset, true) / INT16_SCALE;
    const absolute = Math.abs(sample);
    sumSquares += sample * sample;
    sum += sample;
    if (absolute > peak) peak = absolute;
    if (absolute >= 0.99) clipped += 1;
  }
  const rms = Math.sqrt(sumSquares / sampleCount);
  return {
    sampleCount,
    rms,
    peak,
    dbfs: rms > 0 ? 20 * Math.log10(rms) : -160,
    clippingRatio: clipped / sampleCount,
    dcOffset: sum / sampleCount,
  };
};

export type DcBlockerConfig = { coefficient: number };
export const defaultDcBlockerConfig: DcBlockerConfig = { coefficient: 0.995 };

export class Pcm16DcBlocker {
  private previousInput = 0;
  private previousOutput = 0;
  constructor(private readonly config: DcBlockerConfig = defaultDcBlockerConfig) {
    if (config.coefficient <= 0 || config.coefficient >= 1)
      throw new RangeError('DC blocker coefficient must be in (0, 1)');
  }
  process(pcm: Uint8Array): Uint8Array {
    if (pcm.byteLength === 0 || pcm.byteLength % 2 !== 0)
      throw new RangeError('PCM16 frame must contain a non-zero even number of bytes');
    const input = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    const outputBytes = new Uint8Array(pcm.byteLength);
    const output = new DataView(outputBytes.buffer);
    for (let offset = 0; offset < pcm.byteLength; offset += 2) {
      const sample = input.getInt16(offset, true);
      const filtered = sample - this.previousInput + this.config.coefficient * this.previousOutput;
      output.setInt16(offset, Math.max(-32768, Math.min(32767, Math.round(filtered))), true);
      this.previousInput = sample;
      this.previousOutput = filtered;
    }
    return outputBytes;
  }
  reset() {
    this.previousInput = 0;
    this.previousOutput = 0;
  }
}

export type VadState = 'silence' | 'speech';
export type VadConfig = {
  frameDurationMs: number;
  minSpeechMs: number;
  endSilenceMs: number;
  initialNoiseFloorDbfs: number;
  maxNoiseFloorDbfs: number;
  minStartDbfs: number;
  startSnrDb: number;
  continueSnrDb: number;
  noiseAdaptation: number;
};
export type VadDecision = {
  state: VadState;
  speechStarted: boolean;
  speechEnded: boolean;
  noiseFloorDbfs: number;
  snrDb: number;
  thresholdDbfs: number;
};
export const defaultVadConfig: VadConfig = {
  frameDurationMs: 20,
  minSpeechMs: 120,
  endSilenceMs: 320,
  initialNoiseFloorDbfs: -62,
  maxNoiseFloorDbfs: -32,
  minStartDbfs: -52,
  startSnrDb: 10,
  continueSnrDb: 6,
  noiseAdaptation: 0.04,
};

export class AdaptiveEnergyVad {
  state: VadState = 'silence';
  private noiseFloorDbfs: number;
  private aboveStartFrames = 0;
  private belowContinueFrames = 0;
  constructor(private readonly config: VadConfig = defaultVadConfig) {
    if (config.frameDurationMs <= 0) throw new RangeError('frameDurationMs must be positive');
    if (config.minSpeechMs <= 0 || config.endSilenceMs <= 0)
      throw new RangeError('VAD timing must be positive');
    if (config.noiseAdaptation <= 0 || config.noiseAdaptation > 1)
      throw new RangeError('noiseAdaptation must be in (0, 1]');
    this.noiseFloorDbfs = config.initialNoiseFloorDbfs;
  }
  process(metrics: AudioMetrics): VadDecision {
    const startThreshold = Math.max(this.config.minStartDbfs, this.noiseFloorDbfs + this.config.startSnrDb);
    const continueThreshold = Math.max(this.config.minStartDbfs - 6, this.noiseFloorDbfs + this.config.continueSnrDb);
    const snrDb = metrics.dbfs - this.noiseFloorDbfs;
    let speechStarted = false;
    let speechEnded = false;
    if (this.state === 'silence') {
      if (metrics.dbfs >= startThreshold) this.aboveStartFrames += 1;
      else {
        this.aboveStartFrames = 0;
        this.adaptNoiseFloor(metrics.dbfs);
      }
      const required = Math.max(1, Math.ceil(this.config.minSpeechMs / this.config.frameDurationMs));
      if (this.aboveStartFrames >= required) {
        this.state = 'speech';
        this.aboveStartFrames = 0;
        this.belowContinueFrames = 0;
        speechStarted = true;
      }
    } else {
      if (metrics.dbfs < continueThreshold) this.belowContinueFrames += 1;
      else this.belowContinueFrames = 0;
      const required = Math.max(1, Math.ceil(this.config.endSilenceMs / this.config.frameDurationMs));
      if (this.belowContinueFrames >= required) {
        this.state = 'silence';
        this.belowContinueFrames = 0;
        speechEnded = true;
        this.adaptNoiseFloor(metrics.dbfs);
      }
    }
    return {
      state: this.state,
      speechStarted,
      speechEnded,
      noiseFloorDbfs: this.noiseFloorDbfs,
      snrDb,
      thresholdDbfs: this.state === 'speech' ? continueThreshold : startThreshold,
    };
  }
  reset() {
    this.state = 'silence';
    this.noiseFloorDbfs = this.config.initialNoiseFloorDbfs;
    this.aboveStartFrames = 0;
    this.belowContinueFrames = 0;
  }
  private adaptNoiseFloor(observedDbfs: number) {
    const bounded = Math.min(this.config.maxNoiseFloorDbfs, observedDbfs);
    this.noiseFloorDbfs += (bounded - this.noiseFloorDbfs) * this.config.noiseAdaptation;
  }
}

export type AudioQuality = 'ok' | 'too-quiet' | 'clipping' | 'dc-offset';
export type ProcessedAudioFrame = {
  pcm: Uint8Array;
  metrics: AudioMetrics;
  vad: VadDecision;
  quality: AudioQuality;
};
export class AudioPreprocessingPipeline {
  constructor(
    private readonly conditioner = new Pcm16DcBlocker(),
    private readonly vad = new AdaptiveEnergyVad(),
  ) {}
  process(pcm: Uint8Array): ProcessedAudioFrame {
    const conditioned = this.conditioner.process(pcm);
    const metrics = analyzePcm16Le(conditioned);
    return { pcm: conditioned, metrics, vad: this.vad.process(metrics), quality: classifyQuality(metrics) };
  }
  reset() {
    this.conditioner.reset();
    this.vad.reset();
  }
}
export const classifyQuality = (metrics: AudioMetrics): AudioQuality => {
  if (metrics.clippingRatio >= 0.01) return 'clipping';
  if (Math.abs(metrics.dcOffset) >= 0.08) return 'dc-offset';
  if (metrics.dbfs <= -58) return 'too-quiet';
  return 'ok';
};
