# Fase 1 — repository foundation

## Blueprint-sammenligning

Repositoryet inneholdt kun README og Git-metadata. Dropbox-blueprinten krevde Expo/React Native, native iOS-grense, realtime-tjeneste, learning API, shared contracts, Supabase migrations, tester, admin/web på Netlify og EAS-profiler. Denne strukturen er nå opprettet.

## Implementert i fase 1

- pnpm/Turborepo TypeScript-workspace
- Expo Router iOS-app-shell med kun «Oversett» og «Språklære» synlig; valgene er eksplisitt deaktivert og merket frem til funksjonene implementeres
- versjonerte, runtime-validerte realtime-kontrakter
- backend/realtime- og learning API-pakkegrenser
- Supabase CLI-struktur koblet til prosjektref, uten å kjøre schema-mutations
- test- og benchmarkmapper
- GitHub Actions CI for install, lint, typecheck, test og build
- Netlify-konfigurasjon kun for admin-web
- EAS development/preview/production-profiler for iOS

## Ikke ferdig / neste faser

Database-schema, RLS, auth, mikrofon/native Swift bridge, provider-integrasjoner, realtime transport, læringsinnhold og produksjonsdeploy er ikke implementert i fase 1 og skal ikke omtales som operative.

Fysisk iPhone/AirPods, Apple Developer-signering og provider-secrets kreves senere for full audio- og releaseverifisering.

## Dependency-audit

`pnpm audit --prod --audit-level high` består uten high/critical funn. Audit rapporterer ett moderat transitivt `uuid@7.0.3`-funn via Expo CLI → config plugins → `xcode`. Det finnes ikke en kompatibel direkte oppgradering i prosjektet; vilkårlig override til uuid 11 er derfor ikke brukt. Funnets oppstrømsfiks må følges ved Expo-oppgraderinger.
