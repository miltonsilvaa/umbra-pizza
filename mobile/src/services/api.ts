import { AxiosError, create } from "axios";
import Constants from "expo-constants";

/**
 * No celular, "localhost" é o próprio celular — não o computador que roda a API.
 * Sem EXPO_PUBLIC_API_URL, usa o mesmo IP do computador que está servindo o
 * app pelo Expo (hostUri = "192.168.x.x:8081") na porta da API.
 */
function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:3333` : "http://localhost:3333";
}

export const API_URL = resolveApiUrl();

export const api = create({ baseURL: API_URL, timeout: 10_000 });

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Chamado pelo AuthContext ao entrar/sair. */
export function setApiToken(token: string | null) {
  authToken = token;
}

/** O AuthContext registra aqui o que fazer quando a API recusar o token. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // O login também responde 401 (senha errada) e não deve deslogar ninguém
    const isLogin = error.config?.url === "/session";
    if (error.response?.status === 401 && !isLogin) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Extrai a mensagem de erro padrão da API ({ error: "..." }). */
export function getErrorMessage(error: unknown, fallback = "Algo deu errado. Tente novamente.") {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return `Não foi possível conectar à API (${API_URL}). Celular e computador estão na mesma rede Wi-Fi?`;
    }
    return (error.response.data as { error?: string })?.error ?? fallback;
  }
  return fallback;
}
