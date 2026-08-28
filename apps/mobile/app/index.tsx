import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const choices = [
  { title: 'Oversett', description: 'Forstå en samtale på norsk mens den skjer.' },
  { title: 'Språklære', description: 'Lær språk gjennom praktiske, voksne leksjoner.' },
] as const;

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Text style={styles.eyebrow}>TOLK OG LÆR</Text>
          <Text style={styles.heading}>Hva vil du gjøre?</Text>
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
              <Text style={styles.status}>Kommer i neste implementeringsfase</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAF9' },
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
});
