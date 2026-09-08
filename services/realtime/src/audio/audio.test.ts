import { describe, expect, it } from 'vitest';
import { Pcm16DcBlocker } from './conditioner.js';
import { analyzePcm16Le } from './metrics.js';
import { AudioPreprocessingPipeline, classifyQuality } from './pipeline.js';
import { AdaptiveEnergyVad } from './vad.js';

const pcm16 = (samples: number[]): Uint8Array => {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, index) => view.setInt16(index * 2, sample, true));
  return bytes;
};

const metricsAt = (dbfs: number) => ({
  sampleCount: 320,
  rms: 10 ** (dbfs / 20),
  peak: 10 ** (dbfs / 20),
  dbfs,
  clippingRatio: 0,
  dcOffset: 0,
});

describe('phase 5 audio preprocessing', () => {
  it('measures little-endian PCM16 signal metrics', () => {
    const metrics = analyzePcm16Le(pcm16([0, 16384, -16384, 32767]));
    expect(metrics.sampleCount).toBe(4);
    expect(metrics.peak).toBeGreaterThan(0.99);
    expect(metrics.clippingRatio).toBe(0.25);
    expect(metrics.dbfs).toBeGreaterThan(-10);
  });

  it('rejects malformed PCM16 frames', () => {
    expect(() => analyzePcm16Le(new Uint8Array())).toThrow('non-zero even');
    expect(() => analyzePcm16Le(new Uint8Array([1]))).toThrow('non-zero even');
  });

  it('removes a persistent DC component over time', () => {
    const blocker = new Pcm16DcBlocker();
    const input = pcm16(Array.from({ length: 320 }, () => 8000));
    const first = analyzePcm16Le(blocker.process(input));
    let latest = first;
    for (let i = 0; i < 30; i += 1) latest = analyzePcm16Le(blocker.process(input));
    expect(Math.abs(latest.dcOffset)).toBeLessThan(Math.abs(first.dcOffset));
  });

  it('uses hysteresis before opening and closing speech', () => {
    const vad = new AdaptiveEnergyVad();
    for (let i = 0; i < 5; i += 1) expect(vad.process(metricsAt(-30)).state).toBe('silence');
    const started = vad.process(metricsAt(-30));
    expect(started.state).toBe('speech');
    expect(started.speechStarted).toBe(true);

    for (let i = 0; i < 15; i += 1) expect(vad.process(metricsAt(-70)).state).toBe('speech');
    const ended = vad.process(metricsAt(-70));
    expect(ended.state).toBe('silence');
    expect(ended.speechEnded).toBe(true);
  });

  it('classifies clipping and very quiet input', () => {
    expect(classifyQuality({ ...metricsAt(-3), clippingRatio: 0.02 })).toBe('clipping');
    expect(classifyQuality(metricsAt(-70))).toBe('too-quiet');
  });

  it('runs conditioning metrics and VAD as one resettable pipeline', () => {
    const pipeline = new AudioPreprocessingPipeline();
    const frame = pipeline.process(pcm16(Array.from({ length: 320 }, () => 1000)));
    expect(frame.pcm.byteLength).toBe(640);
    expect(frame.metrics.sampleCount).toBe(320);
    expect(['silence', 'speech']).toContain(frame.vad.state);
    pipeline.reset();
  });
});
