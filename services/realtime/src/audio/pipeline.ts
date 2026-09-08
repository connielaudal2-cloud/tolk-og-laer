import { Pcm16DcBlocker } from './conditioner.js';
import { analyzePcm16Le, type AudioMetrics } from './metrics.js';
import { AdaptiveEnergyVad, type VadDecision } from './vad.js';

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
    return {
      pcm: conditioned,
      metrics,
      vad: this.vad.process(metrics),
      quality: classifyQuality(metrics),
    };
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
