import type { AudioMetrics } from './metrics.js';

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
    const startThreshold = Math.max(
      this.config.minStartDbfs,
      this.noiseFloorDbfs + this.config.startSnrDb,
    );
    const continueThreshold = Math.max(
      this.config.minStartDbfs - 6,
      this.noiseFloorDbfs + this.config.continueSnrDb,
    );
    const snrDb = metrics.dbfs - this.noiseFloorDbfs;
    let speechStarted = false;
    let speechEnded = false;

    if (this.state === 'silence') {
      if (metrics.dbfs >= startThreshold) {
        this.aboveStartFrames += 1;
      } else {
        this.aboveStartFrames = 0;
        this.adaptNoiseFloor(metrics.dbfs);
      }

      const requiredStartFrames = Math.max(
        1,
        Math.ceil(this.config.minSpeechMs / this.config.frameDurationMs),
      );
      if (this.aboveStartFrames >= requiredStartFrames) {
        this.state = 'speech';
        this.aboveStartFrames = 0;
        this.belowContinueFrames = 0;
        speechStarted = true;
      }
    } else {
      if (metrics.dbfs < continueThreshold) this.belowContinueFrames += 1;
      else this.belowContinueFrames = 0;

      const requiredEndFrames = Math.max(
        1,
        Math.ceil(this.config.endSilenceMs / this.config.frameDurationMs),
      );
      if (this.belowContinueFrames >= requiredEndFrames) {
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
