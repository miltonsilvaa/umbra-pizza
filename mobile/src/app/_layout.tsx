import { DarkTheme, SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.brand,
    background: colors.background,
    card: colors.background,
    text: colors.foreground,
    border: colors.line,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <StatusBar style="light" />
        <SplashController />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

/** Mantém a splash até descobrir se há sessão salva (evita piscar a tela de login). */
function SplashController() {
  const { isLoading } = useAuth();
  if (!isLoading) {
    SplashScreen.hide();
  }
  return null;
}

function RootNavigator() {
  const { user } = useAuth();
  const signed = !!user;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={signed}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!signed}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
