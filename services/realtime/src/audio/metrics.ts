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
  if (pcm.byteLength === 0 || pcm.byteLength % 2 !== 0) {
    throw new RangeError('PCM16 frame must contain a non-zero even number of bytes');
  }

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
