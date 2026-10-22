import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, TOUCH_HEIGHT } from "@/constants/theme";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ value, onChange, min = 1, max = 99 }: QuantityStepperProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Quantidade</Text>
      <View style={styles.row}>
        <StepButton icon="remove" label="Diminuir quantidade" disabled={value <= min} onPress={() => onChange(value - 1)} />
        <Text style={styles.value} accessibilityLiveRegion="polite" accessibilityLabel={`Quantidade ${value}`}>
          {value}
        </Text>
        <StepButton icon="add" label="Aumentar quantidade" disabled={value >= max} onPress={() => onChange(value + 1)} />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: "add" | "remove";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={24} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { color: colors.muted, fontSize: 14, fontWeight: "500" },
  row: {
    height: TOUCH_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  button: { width: TOUCH_HEIGHT, height: "100%", alignItems: "center", justifyContent: "center" },
  pressed: { backgroundColor: colors.surfaceHover },
  disabled: { opacity: 0.35 },
  value: { flex: 1, textAlign: "center", color: colors.foreground, fontSize: 20, fontWeight: "700" },
});
