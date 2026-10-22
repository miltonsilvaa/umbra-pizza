import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Armazenamento da sessão: SecureStore (Keychain/Keystore) no celular.
 * O SecureStore não existe na web, então lá usa localStorage — serve só para
 * desenvolvimento/testes no navegador.
 */
export async function getItem(key: string) {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
