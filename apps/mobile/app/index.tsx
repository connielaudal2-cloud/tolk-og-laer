import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../src/core/auth';

type MobileSession = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

const choices = [
  { title: 'Oversett', description: 'Forstå en samtale på norsk mens den skjer.' },
  { title: 'Språklære', description: 'Lær språk gjennom praktiske, voksne leksjoner.' },
] as const;

export default function HomeScreen() {
  const [session, setSession] = useState<MobileSession>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 8) {
      Alert.alert('Kontroller opplysningene', 'Bruk en gyldig e-postadresse og et passord på minst 8 tegn.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'sign-up') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          Alert.alert(
            'Bekreft e-postadressen',
            'Kontoen er opprettet. Åpne bekreftelseslenken i e-posten før du logger inn.',
          );
          setMode('sign-in');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ukjent autentiseringsfeil';
      Alert.alert(mode === 'sign-up' ? 'Kunne ikke opprette konto' : 'Kunne ikke logge inn', message);
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Kunne ikke logge ut', error.message);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.muted}>Kontrollerer innlogging …</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authContainer}>
          <View>
            <Text style={styles.eyebrow}>TOLK OG LÆR</Text>
            <Text style={styles.heading}>{mode === 'sign-up' ? 'Opprett konto' : 'Logg inn'}</Text>
            <Text style={styles.lead}>Bruk samme konto for oversettelse og språklæring.</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="E-post"
              style={styles.input}
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              onChangeText={setPassword}
              placeholder="Passord (minst 8 tegn)"
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <Pressable disabled={submitting} onPress={() => void submit()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Arbeider …' : mode === 'sign-up' ? 'Opprett konto' : 'Logg inn'}
              </Text>
            </Pressable>
            <Pressable
              disabled={submitting}
              onPress={() => setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                {mode === 'sign-up' ? 'Har du allerede konto? Logg inn' : 'Ny bruker? Opprett konto'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Text style={styles.eyebrow}>TOLK OG LÆR</Text>
          <Text style={styles.heading}>Hva vil du gjøre?</Text>
          <Text style={styles.signedInAs}>Innlogget som {session.user.email ?? 'bruker'}</Text>
        </View>
        <View style={styles.choices}>
          {choices.map((choice) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={choice.title}
              disabled
              key={choice.title}
              style={styles.card}
            >
              <Text style={styles.title}>{choice.title}</Text>
              <Text style={styles.description}>{choice.description}</Text>
              <Text style={styles.status}>Neste: koble autentisert translatorsesjon til live backend</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => void signOut()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Logg ut</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF9' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: '#789088', fontSize: 14 },
  authContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  eyebrow: { color: '#35645A', fontSize: 12, fontWeight: '700', letterSpacing: 1.6 },
  heading: {
    color: '#13231F',
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: -0.8,
    marginTop: 10,
  },
  lead: { color: '#536660', fontSize: 16, lineHeight: 23, marginTop: 12 },
  signedInAs: { color: '#536660', fontSize: 14, marginTop: 10 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8D8D2',
    borderRadius: 14,
    borderWidth: 1,
    color: '#13231F',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#173D34',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkButton: { alignItems: 'center', paddingVertical: 10 },
  linkText: { color: '#35645A', fontSize: 14, fontWeight: '600' },
  choices: { gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE7E3',
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
  },
  title: { color: '#13231F', fontSize: 24, fontWeight: '600' },
  description: { color: '#536660', fontSize: 16, lineHeight: 23, marginTop: 8 },
  status: { color: '#789088', fontSize: 12, marginTop: 18 },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#C8D8D2',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryButtonText: { color: '#35645A', fontSize: 15, fontWeight: '600' },
});
