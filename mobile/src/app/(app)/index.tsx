import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { api, getErrorMessage } from "@/services/api";
import { showError } from "@/lib/feedback";
import { colors, radius } from "@/constants/theme";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { Order } from "@/types";

export default function OpenTableScreen() {
  const { user, signOut } = useAuth();
  // ?sent=12 → veio da tela de resumo depois de enviar o pedido da mesa 12
  const { sent } = useLocalSearchParams<{ sent?: string }>();
  const [table, setTable] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => router.setParams({ sent: undefined }), 4000);
    return () => clearTimeout(timer);
  }, [sent]);

  async function handleOpenTable() {
    const tableNumber = Number(table);
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
      showError("Informe um número de mesa válido.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<Order>("/order", { table: tableNumber, name: name.trim() || undefined });
      setTable("");
      setName("");
      router.push({
        pathname: "/order/[id]",
        params: { id: data.id, table: String(data.table), name: data.name ?? "" },
      });
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Logo size={22} />
        <Pressable
          onPress={signOut}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          style={styles.logout}
        >
          <Text style={styles.greeting}>{user?.name.split(" ")[0]}</Text>
          <Ionicons name="log-out-outline" size={22} color={colors.muted} />
        </Pressable>
      </View>

      {sent && (
        <View style={styles.banner} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={22} color={colors.background} />
          <Text style={styles.bannerText}>Pedido da mesa {sent} enviado para a cozinha!</Text>
        </View>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.titleBox}>
            <Text style={styles.title}>Novo pedido</Text>
            <Text style={styles.subtitle}>Abra a mesa para começar a lançar os itens.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Número da mesa"
              placeholder="Ex: 12"
              value={table}
              onChangeText={(text) => setTable(text.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.tableInput}
              returnKeyType="next"
            />
            <Input
              label="Nome do cliente (opcional)"
              placeholder="Ex: Carlos"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="go"
              onSubmitEditing={handleOpenTable}
            />
            <Button
              title="Abrir mesa"
              onPress={handleOpenTable}
              loading={loading}
              disabled={!table}
              size="lg"
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logout: { flexDirection: "row", alignItems: "center", gap: 8 },
  greeting: { color: colors.muted, fontSize: 14 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.success,
  },
  bannerText: { flex: 1, color: colors.background, fontWeight: "700", fontSize: 15 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 32 },
  titleBox: { gap: 6 },
  title: { color: colors.foreground, fontSize: 32, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 16 },
  form: { gap: 16 },
  tableInput: { fontSize: 28, fontWeight: "700", minHeight: 64, textAlign: "center" },
  button: { marginTop: 8 },
});
