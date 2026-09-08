# Phase 5: audio conditioning and adaptive VAD

Status: IMPLEMENTED IN BRANCH — awaiting CI/merge and physical-device audio QA.

## Scope implemented

- PCM16 little-endian signal metrics: RMS, dBFS, peak, clipping ratio and DC offset.
- Stateful first-order DC blocker for transient realtime PCM frames.
- Adaptive energy voice activity detection with a moving noise floor.
- Start/end hysteresis to reduce false speech boundaries.
- Audio quality classification for clipping, excessive DC offset and very quiet input.
- Resettable preprocessing pipeline that keeps transient audio in memory only.

## Architectural boundaries

This phase does not persist raw audio and does not log conversation content. The preprocessing code is provider-neutral and runs before speaker diarization, language identification and streaming ASR. It does not claim to provide neural noise suppression or production-grade speech enhancement.

## Validation

Automated tests cover malformed PCM, signal metrics, DC-offset decay, VAD start/end hysteresis, quality classification and pipeline reset behavior.

Physical iPhone + AirPods validation remains mandatory before Phase 5 can be considered runtime-quality complete. Required environments include quiet room, car/taxi, street, restaurant/cafe, wind, traffic and music/radio interference.

## Next work after merge

1. Wire native audio frames into the preprocessing pipeline/session orchestration.
2. Add frame-drop/backpressure instrumentation without logging raw audio.
3. Add benchmark fixtures for noise/VAD regression.
4. Evaluate whether native/iOS Voice Processing or a server-side enhancement provider materially improves benchmark results before adding a heavier enhancement layer.
5. Proceed to Phase 6 only after the Phase 5 integration path is stable.
