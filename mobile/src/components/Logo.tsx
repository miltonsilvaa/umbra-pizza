import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

/** Marca do sistema — troque o nome aqui para personalizar a pizzaria. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="Umbra Pizza">
      <Ionicons name="pizza" size={size * 1.05} color={colors.brand} />
      <Text style={[styles.text, { fontSize: size }]}>
        umbra<Text style={{ color: colors.brand }}>pizza</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { color: colors.foreground, fontWeight: "800", letterSpacing: -0.5 },
});
