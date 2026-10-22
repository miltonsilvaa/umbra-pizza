import axios, { AxiosError } from "axios";
import { getToken, removeToken } from "@/lib/cookies";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Token expirado/inválido em uma rota protegida → volta para o login.
    // O próprio login (/session) também responde 401 e não deve disparar isso.
    const isLogin = error.config?.url === "/session";

    if (error.response?.status === 401 && !isLogin && typeof window !== "undefined") {
      removeToken();
      // Fora de componente não há useRouter; o reload completo também limpa o estado em memória
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

/** Extrai a mensagem de erro padrão da API ({ error: "..." }). */
export function getErrorMessage(error: unknown, fallback = "Algo deu errado. Tente novamente.") {
  if (error instanceof AxiosError) {
    if (!error.response) return "Não foi possível conectar à API.";
    return (error.response.data as { error?: string })?.error ?? fallback;
  }
  return fallback;
}

/**
 * URL pública da imagem de um produto. Produtos novos guardam a URL completa
 * do Cloudinary; produtos antigos (anteriores à migração) guardam só o nome
 * do arquivo, servido pela API em /files.
 */
export function bannerUrl(banner: string) {
  if (banner.startsWith("http")) return banner;
  return `${API_URL}/files/${banner}`;
}
