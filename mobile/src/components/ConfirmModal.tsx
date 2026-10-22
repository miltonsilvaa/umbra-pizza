import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/constants/theme";
import { Button } from "@/components/Button";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmação no tema do app (o Alert nativo não segue o tema e não funciona na web). */
export function ConfirmModal({ visible, title, message, confirmLabel, loading, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.center}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Cancelar" />
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button title="Cancelar" variant="ghost" onPress={onCancel} style={styles.action} disabled={loading} />
            <Button title={confirmLabel} onPress={onConfirm} loading={loading} style={styles.action} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.65)" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    gap: 10,
  },
  title: { color: colors.foreground, fontSize: 20, fontWeight: "700" },
  message: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  action: { flex: 1 },
});
