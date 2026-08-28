# Fase 2: database, Auth og RLS

Fase 2 er implementert og verifisert mot Supabase-prosjektet
`ipkugzwdhrbnqvwgxven`. Migrasjonene i `supabase/migrations` er eneste kilde
til schemaendringer.

## Migrasjoner

1. `20260828213035_identity_and_reference.sql` – enums, språk, profiler,
   preferanser og sikker Auth-trigger.
2. `20260828213037_learning_domain.sql` – læringsstruktur, progresjon,
   repetisjon og uttaleforsøk.
3. `20260828213039_translator_and_operations.sql` – oversetterdata,
   sammendrag, metrikk, leverandørbruk og revisjonshendelser.
4. `20260828213041_rls_grants_and_indexes.sql` – grants, RLS-policyer og
   spørringsindekser.
5. `20260828213043_seed_reference_data.sql` – fem språk og 24 kategorier per
   læringsspråk; ingen falske brukere eller leksjoner.
6. `20260828213203_advisor_remediations.sql` – manglende FK-indekser og
   eksplisitte deny-all-policyer på backend-tabeller.

## Datamodell og tilgang

Schemaet inneholder 19 tabeller: `profiles`, `user_preferences`, `languages`,
`learning_categories`, `learning_chapters`, `lessons`, `lesson_items`,
`user_course_enrollments`, `user_lesson_progress`, `review_items`,
`pronunciation_attempts`, `translator_sessions`, `translator_speakers`,
`transcript_segments`, `translation_segments`, `conversation_summaries`,
`translator_session_metrics`, `provider_usage` og `audit_events`.

Alle tabeller har RLS. Brukere kan bare lese og endre egne private rader via
policyer basert på `(select auth.uid())`. Referansedata og publisert
læringsinnhold har eksplisitte lesepolicyer for klientroller. Utkast er ikke
offentlige. `provider_usage` og `audit_events` er backend-only: klientrollene
har ingen tabellrettigheter og tabellene har i tillegg restriktive deny-all
RLS-policyer. Service/backend-tilgang er derfor ikke gjort tilgjengelig ved å
svekke klientpolicyene.

## Auth

Den typede klienten støtter email/passord og magic link. Mobiladapteren bruker
AsyncStorage, URL-polyfill, prosesslås og livssyklusbasert token-refresh.
Magic-link callback er `tolk-og-laer://auth/callback`. Ved opprettelse av en
Auth-bruker lager en `security definer`-trigger automatisk `profiles` og
`user_preferences`. Profilen er knyttet kun til `auth.users.id`, slik at Apple
Sign In kan legges til senere uten schemaendring.

## Verifikasjon

- Alle seks migrasjoner er kjørt på prosjektet og finnes i remote
  migrasjonshistorikk.
- Automatiserte RLS-tester er kjørt gjennom Supabase Data API med to isolerte,
  midlertidige Auth-brukere: 4 av 4 tester besto.
- Testene verifiserer egen data, blokkering av annen bruker, offentlig
  referansedata, insert/update/delete og blokkert backend-data.
- De midlertidige Auth-brukerne og alle kaskaderte testdata er slettet etter
  testen og kontrollert til 0 gjenværende rader.
- Security Advisor: 0 funn etter utbedring.
- Performance Advisor: 0 manglende FK-indekser. Gjenstående INFO-funn er
  forventede ubrukt-indeks-varsler i en ny database uten produksjonstrafikk,
  samt prosjektinnstillingen for absolutt Auth-tilkoblingsgrense. Indeksene
  beholdes for kjente tilgangsmønstre; Auth-innstillingen vurderes ved
  oppskalering.
- TypeScript-typer er generert fra remote schema i
  `supabase/types/database.ts` og brukes av `@tolk-og-laer/api-client` og
  mobilens Auth-adapter.

Supabase-advisorreferanser:

- <https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index>
- <https://supabase.com/docs/guides/deployment/going-into-prod>

## Avgrensning

Oversetter-UI, realtime lydtransport, fullt læringsinnhold, komplisert
onboarding og Apple Sign In er ikke implementert i denne fasen. Ingen secrets
er lagret i repositoryet.
