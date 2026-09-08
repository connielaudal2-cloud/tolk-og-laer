export type DcBlockerConfig = {
  coefficient: number;
};

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
      const clipped = Math.max(-32768, Math.min(32767, Math.round(filtered)));
      output.setInt16(offset, clipped, true);
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
