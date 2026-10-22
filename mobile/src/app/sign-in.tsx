import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/services/api";
import { showError } from "@/lib/feedback";
import { colors } from "@/constants/theme";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      showError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      // Ao entrar, o Stack.Protected troca para as telas do app sozinho
      await signIn(email.trim().toLowerCase(), password);
    } catch (error) {
      showError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={36} />
            <Text style={styles.subtitle}>App do garçom</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="E-mail"
              placeholder="voce@pizzaria.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <Input
              label="Senha"
              placeholder="••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
            />
            <Button title="Entrar" onPress={handleSignIn} loading={loading} style={styles.button} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 40 },
  header: { alignItems: "center", gap: 8 },
  subtitle: { color: colors.muted, fontSize: 16 },
  form: { gap: 16 },
  button: { marginTop: 8 },
});
