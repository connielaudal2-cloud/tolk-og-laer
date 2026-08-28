# Fase 3A: iOS audio foundation og realtime-arkitektur

Implementasjonen følger Dropbox-dokumentene `TECHNICAL_BUILD_BLUEPRINT_FINAL`,
`PLATFORM_DECISION_MOBILE_APP`, `TRANSLATOR_OPTIMIZED_ARCHITECTURE`,
`AUDIO_AND_NOISE_STRATEGY`, `TRANSLATOR_FINAL`, `API_FINAL`,
`TEST_AND_RELEASE_FINAL` og `Privacy`.

## Implementert

- Et lokalt Expo native module, `TolkNativeAudio`, skrevet i Swift.
- Reell mikrofontillatelse via iOS, `AVAudioSession` i `playAndRecord` / `voiceChat`,
  Bluetooth HFP, speaker fallback og route-change events.
- `AVAudioEngine` capture med konvertering til mono PCM signed 16-bit, 16 kHz og
  20/40 ms rammer. Audio beholdes transient i minnet og sendes ikke til logger
  eller permanent lagring.
- Signalnivå per ramme i dBFS for senere helse-/VAD-observasjon.
- Smal, typet JS-bridge for permission, route, start/stop og audio frames.
- Versjonert realtime-kontrakt med validerte JSON-kontrollhendelser og et
  provider-uavhengig binært audioformat.
- Binær audio-header med sekvensnummer, duplikatkontroll og gap-detektering.
- Realtime session state machine og bounded exponential reconnect-policy.
- Mobil WebSocket-transport med WSS-krav utenfor localhost, kortlivet
  brukertoken i WebSocket-subprotocol, runtime-validering, deduplisering og
  separat binær audioflyt.
- Netlify er eksplisitt utelukket som realtime-transport.

## Sikkerhets- og personverngrenser

Provider-secrets finnes ikke i klientkontraktene. Realtime-endepunktet skal
utstede/validere kortlivede, brukerskopede tokens. Kontinuerlig audio går ikke
via Supabase Edge Functions eller Netlify. Rå audio er transient og ligger ikke
i eventloggen. Full backend token-verifikasjon og provider-tilkobling aktiveres
før en ende-til-ende-sesjon kan kjøres.

## Verifikasjon og begrensninger

TypeScript-kontrakter, binary frame parsing, state transitions, duplikater,
sekvensgap, reconnect backoff og WSS-kravet dekkes av automatiserte tester.
Expo autolinking kontrollerer at native-modulen oppdages. iOS prebuild kan ikke
genereres på Windows og inngår derfor i Mac/EAS-gaten nedenfor.

Swift-koden kan ikke kompileres eller hardwaretestes på Windows. Følgende er
derfor eksplisitte 3A hardware-gates:

- EAS development build med Apple-signering.
- Mikrofoncapture på fysisk iPhone.
- Route changes og input/output med aktuelle AirPods-modeller.
- Bluetooth HFP-kvalitet, speaker fallback, interruption og telefonanrop.
- Måling av latency, buffer underruns, minne, varme og batteri.

Ende-til-ende streaming krever et deployet realtime-endepunkt, token-issuer og
server-side STT/translation/TTS credentials. Ingen providerrespons er simulert
som produksjonsfunksjonalitet i denne fasen.
