import type { ServerControlEvent } from '@tolk-og-laer/contracts';
import {
  createNativeAudioStream,
  type AudioStreamFrameReport,
} from '../../core/audio';
import { supabase } from '../../core/auth';
import { RealtimeTransport, TranslationSessionApi } from '../../core/networking';
import {
  TranslatorSessionController,
  type TranslatorControllerState,
} from './session-controller';

export type TranslatorRuntimeOptions = {
  onEvent?: (event: ServerControlEvent) => void;
  onState?: (state: TranslatorControllerState) => void;
  onAudioFrame?: (report: AudioStreamFrameReport) => void;
  onCaptureGap?: (expected: number, received: number) => void;
  onBackpressure?: (bufferedBytes: number, limitBytes: number) => void;
};

export const createSecureUuidV4 = (): string => {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues)
    throw new Error('Secure random number generation is unavailable on this runtime');
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const createTranslatorSessionController = (
  options: TranslatorRuntimeOptions = {},
): TranslatorSessionController => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const realtimeUrl = process.env.EXPO_PUBLIC_REALTIME_URL ?? '';
  if (!apiUrl) throw new Error('EXPO_PUBLIC_API_URL is required');
  if (!realtimeUrl) throw new Error('EXPO_PUBLIC_REALTIME_URL is required');

  const api = new TranslationSessionApi(apiUrl);
  return new TranslatorSessionController({
    api,
    accessToken: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error('User must be authenticated before starting translator');
      return accessToken;
    },
    createTransport: (accessToken) =>
      new RealtimeTransport({
        url: realtimeUrl,
        accessToken,
        onEvent: options.onEvent ?? (() => undefined),
        onBackpressure: options.onBackpressure,
      }),
    createAudioStream: (transport) =>
      createNativeAudioStream({
        transport,
        onFrame: options.onAudioFrame,
        onCaptureGap: options.onCaptureGap,
      }),
    createEventId: createSecureUuidV4,
    onState: options.onState,
  });
};
