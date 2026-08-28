import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Tolk og Lær',
  slug: 'tolk-og-laer',
  scheme: 'tolk-og-laer',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  plugins: ['expo-router'],
  experiments: { typedRoutes: true },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'no.tolkoglaer.app',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Tolk og Lær trenger mikrofontilgang for å tolke samtaler i sanntid.',
    },
  },
  extra: { appEnv: process.env.APP_ENV ?? 'development' },
});
