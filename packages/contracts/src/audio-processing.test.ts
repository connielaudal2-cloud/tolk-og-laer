import { describe, expect, it } from 'vitest';
import {
  AdaptiveEnergyVad,
  AudioPreprocessingPipeline,
  Pcm16DcBlocker,
  analyzePcm16Le,
  classifyQuality,
} from './audio-processing.js';

const pcm16 = (samples: number[]) => {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, index) => view.setInt16(index * 2, sample, true));
  return bytes;
};

const metrics = (dbfs: number) => ({
  sampleCount: 320,
  rms: 0,
  peak: 0,
  dbfs,
  clippingRatio: 0,
  dcOffset: 0,
});

describe('audio processing', () => {
  it('measures PCM16 and classifies clipping', () => {
    const result = analyzePcm16Le(pcm16([32767, -32768, 0, 0]));
    expect(result.sampleCount).toBe(4);
    expect(result.clippingRatio).toBe(0.5);
    expect(classifyQuality(result)).toBe('clipping');
  });

  it('removes steady DC over time and resets deterministically', () => {
    const blocker = new Pcm16DcBlocker();
    const input = pcm16(Array.from({ length: 320 }, () => 5000));
    const first = blocker.process(input);
    const second = blocker.process(input);
    expect(Math.abs(analyzePcm16Le(second).dcOffset)).toBeLessThan(
      Math.abs(analyzePcm16Le(first).dcOffset),
    );
    blocker.reset();
    expect(blocker.process(input)).toEqual(first);
  });

  it('uses hysteresis for stable speech start and end', () => {
    const vad = new AdaptiveEnergyVad();
    for (let i = 0; i < 5; i += 1) expect(vad.process(metrics(-25)).speechStarted).toBe(false);
    expect(vad.process(metrics(-25)).speechStarted).toBe(true);
    for (let i = 0; i < 15; i += 1) expect(vad.process(metrics(-70)).speechEnded).toBe(false);
    expect(vad.process(metrics(-70)).speechEnded).toBe(true);
  });

  it('runs one resettable preprocessing pipeline', () => {
    const pipeline = new AudioPreprocessingPipeline();
    const input = pcm16(Array.from({ length: 320 }, () => 1000));
    const first = pipeline.process(input);
    expect(first.pcm.byteLength).toBe(input.byteLength);
    expect(first.metrics.sampleCount).toBe(320);
    pipeline.reset();
    expect(pipeline.process(input).pcm).toEqual(first.pcm);
  });
});
