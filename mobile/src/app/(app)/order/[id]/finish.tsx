import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, getErrorMessage } from "@/services/api";
import { showError } from "@/lib/feedback";
import { formatPrice } from "@/lib/format";
import { colors, radius } from "@/constants/theme";
import { Button } from "@/components/Button";
import type { OrderDetail } from "@/types";

export default function FinishOrderScreen() {
  const insets = useSafeAreaInsets();
  const { id, table } = useLocalSearchParams<{ id: string; table: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [sending, setSending] = useState(false);

  // Busca o pedido na API (e não da tela anterior): o total vem calculado pelo servidor
  useEffect(() => {
    api
      .get<OrderDetail>("/order/detail", { params: { order_id: id } })
      .then(({ data }) => setOrder(data))
      .catch((error) => {
        showError(getErrorMessage(error));
        router.back();
      });
  }, [id]);

  async function handleSend() {
    setSending(true);
    try {
      await api.put("/order/send", { order_id: id });
      // Volta para "abrir mesa" limpando a pilha (mesa e resumo saem do histórico)
      router.dismissTo({ pathname: "/", params: { sent: table } });
    } catch (error) {
      showError(getErrorMessage(error));
      setSending(false);
    }
  }

  if (!order) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tableBox}>
          <Text style={styles.tableLabel}>Mesa</Text>
          <Text style={styles.tableNumber}>{order.table}</Text>
          {order.name ? <Text style={styles.client}>{order.name}</Text> : null}
        </View>

        <View style={styles.card}>
          {order.items.map((item, index) => (
            <View key={item.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <Text style={styles.amount}>{item.amount}x</Text>
              <Text style={styles.name} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.price}>{formatPrice(Number(item.product.price) * item.amount)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total da mesa</Text>
          <Text style={styles.total}>{formatPrice(order.total)}</Text>
        </View>
        <Button
          title="Confirmar pedido"
          onPress={handleSend}
          loading={sending}
          size="lg"
          icon={<Ionicons name="send" size={20} color={colors.foreground} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, gap: 24 },
  tableBox: { alignItems: "center", paddingVertical: 8 },
  tableLabel: { color: colors.muted, fontSize: 15 },
  tableNumber: { color: colors.foreground, fontSize: 56, fontWeight: "800", lineHeight: 64 },
  client: { color: colors.muted, fontSize: 16 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  amount: { color: colors.brand, fontWeight: "800", fontSize: 16, minWidth: 36 },
  name: { flex: 1, color: colors.foreground, fontSize: 16 },
  price: { color: colors.muted, fontSize: 15 },
  footer: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  totalRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  totalLabel: { color: colors.muted, fontSize: 16 },
  total: { color: colors.foreground, fontSize: 28, fontWeight: "800" },
});
