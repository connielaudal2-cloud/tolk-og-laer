import { describe, expect, it, vi } from 'vitest';
import type { AudioFrame } from '@tolk-og-laer/native-audio';
import { NativeAudioStream, type NativeCaptureAdapter } from './stream';

const frame = (sequence: number): AudioFrame => ({
  sequence,
  timestampMs: sequence * 20,
  pcmBase64: btoa(String.fromCharCode(0, 0, 1, 0, 2, 0, 3, 0)),
  levelDbfs: -30,
});

describe('NativeAudioStream', () => {
  it('keeps wire sequence contiguous when backpressure drops a frame and reports capture gaps', async () => {
    let listener: ((value: AudioFrame) => void) | undefined;
    const remove = vi.fn();
    const capture: NativeCaptureAdapter = {
      addFrameListener: (next) => {
        listener = next;
        return { remove };
      },
      start: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
    };
    const sendAudio = vi
      .fn<(sequence: number, pcm: Uint8Array) => boolean>()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const onCaptureGap = vi.fn();
    const reports: boolean[] = [];
    const stream = new NativeAudioStream({
      capture,
      transport: { sendAudio },
      onCaptureGap,
      onFrame: (report) => reports.push(report.sent),
    });

    await stream.start();
    listener!(frame(0));
    listener!(frame(2));
    listener!(frame(3));

    expect(sendAudio.mock.calls.map(([sequence]) => sequence)).toEqual([0, 1, 1]);
    expect(reports).toEqual([true, false, true]);
    expect(onCaptureGap).toHaveBeenCalledWith(1, 2);
    expect(stream.getDiagnostics()).toMatchObject({
      captureFrames: 3,
      sentFrames: 2,
      droppedForBackpressure: 1,
      captureSequenceGaps: 1,
    });

    await stream.stop();
    expect(capture.stop).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('cleans up the listener when native capture fails to start', async () => {
    const remove = vi.fn();
    const capture: NativeCaptureAdapter = {
      addFrameListener: () => ({ remove }),
      start: vi.fn(async () => {
        throw new Error('capture failed');
      }),
      stop: vi.fn(async () => undefined),
    };
    const stream = new NativeAudioStream({
      capture,
      transport: { sendAudio: vi.fn(() => true) },
    });
    await expect(stream.start()).rejects.toThrow('capture failed');
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
