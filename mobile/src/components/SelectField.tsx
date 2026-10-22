import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, TOUCH_HEIGHT } from "@/constants/theme";

export interface SelectOption {
  id: string;
  label: string;
  /** texto à direita da opção (ex: preço) */
  detail?: string;
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
  emptyText?: string;
}

/** Campo que abre uma lista em "bottom sheet" — mais fácil de tocar que um dropdown nativo. */
export function SelectField({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  disabled = false,
  emptyText = "Nenhuma opção disponível",
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.id === selectedId);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        style={({ pressed }) => [styles.field, pressed && styles.pressed, disabled && styles.disabled]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        {selected?.detail && <Text style={styles.detail}>{selected.detail}</Text>}
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Fechar lista" />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{label}</Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
            renderItem={({ item }) => {
              const active = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.optionText, active && { color: colors.brand }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.detail && <Text style={styles.detail}>{item.detail}</Text>}
                  {active && <Ionicons name="checkmark" size={22} color={colors.brand} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { color: colors.muted, fontSize: 14, fontWeight: "500" },
  field: {
    minHeight: TOUCH_HEIGHT,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pressed: { backgroundColor: colors.surfaceHover },
  disabled: { opacity: 0.5 },
  value: { flex: 1, color: colors.foreground, fontSize: 16 },
  placeholder: { color: colors.muted },
  detail: { color: colors.muted, fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    maxHeight: "70%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 },
  sheetTitle: { color: colors.foreground, fontSize: 18, fontWeight: "700", marginBottom: 8, paddingHorizontal: 4 },
  option: {
    minHeight: TOUCH_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  optionActive: { backgroundColor: "rgba(255,63,75,0.1)" },
  optionText: { flex: 1, color: colors.foreground, fontSize: 16 },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 24 },
});
