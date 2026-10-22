import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { colors, radius, TOUCH_HEIGHT } from "@/constants/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "success" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  size?: "md" | "lg";
  style?: StyleProp<ViewStyle>;
}

const variants = {
  primary: { bg: colors.brand, pressed: colors.brandPressed, text: colors.foreground },
  success: { bg: colors.success, pressed: "#35d98b", text: colors.background },
  ghost: { bg: colors.surface, pressed: colors.surfaceHover, text: colors.foreground },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  size = "md",
  style,
}: ButtonProps) {
  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === "lg" && styles.lg,
        { backgroundColor: pressed ? v.pressed : v.bg },
        variant === "ghost" && styles.ghostBorder,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, size === "lg" && styles.textLg, { color: v.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_HEIGHT,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  lg: { minHeight: 60 },
  ghostBorder: { borderWidth: 1, borderColor: colors.line },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: "700" },
  textLg: { fontSize: 18 },
});
