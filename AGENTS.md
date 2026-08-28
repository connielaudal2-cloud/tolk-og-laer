# Prosjektregler

- Prosjektet er fullstendig separat fra Cats in Africa / Cats of Marrakech. Ikke importer kode, secrets, infrastruktur eller data derfra.
- `main` er hovedbranch. Ferdige milepæler skal bygge og testes før commit/push.
- Dropbox-blueprintene under `/Tolk & Lær` er produkt- og arkitekturfasit. Nyere `FINAL`-dokumenter går foran eldre dokumenter.
- Mobilappen er Expo/React Native med native Swift-moduler for audio- og AirPods-kritiske funksjoner.
- Netlify brukes bare for web/admin og korte webfunksjoner, aldri som kontinuerlig realtime audio-transport.
- Supabase-skjema endres gjennom versjonerte migrations. RLS kreves på alle eksponerte private tabeller.
- Klienter mottar aldri service-role- eller provider-secrets.
- Ikke lag falske integrasjoner eller tomme knapper. Uimplementerte kapabiliteter skal være tydelig dokumentert eller skjult.
- Rå audio og private samtaler lagres ikke som standard og skal ikke skrives til logger.
- Delte API- og realtime-kontrakter skal valideres ved runtime og versjoneres.
- Kode er ikke ferdig før relevante tester, build og dokumentert akseptanse er bestått.
