import { Alert, Platform } from "react-native";

/** Alerta de erro que também aparece na web (onde o Alert do RN não faz nada). */
export function showError(message: string, title = "Ops!") {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
