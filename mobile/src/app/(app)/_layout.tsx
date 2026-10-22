import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="order/[id]/index"
        // Sair da mesa passa pelo botão "X" (que pergunta se quer descartar),
        // então o gesto de voltar fica desligado
        options={{ gestureEnabled: false, headerBackVisible: false }}
      />
      <Stack.Screen name="order/[id]/finish" options={{ title: "Resumo do pedido" }} />
    </Stack>
  );
}
