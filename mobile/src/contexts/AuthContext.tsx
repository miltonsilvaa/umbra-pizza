import { createContext, use, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { api, setApiToken, setUnauthorizedHandler } from "@/services/api";
import { getItem, removeItem, setItem } from "@/lib/storage";
import type { Session, User } from "@/types";

const TOKEN_KEY = "pizzaria.token";
const USER_KEY = "pizzaria.user";

interface AuthContextData {
  user: User | null;
  /** true enquanto lê a sessão salva — a splash fica visível nesse tempo */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function signOut() {
    setApiToken(null);
    setUser(null);
    await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
  }

  useEffect(() => {
    setUnauthorizedHandler(signOut);

    // Restaura a sessão salva. Mostra o usuário guardado na hora (abre rápido,
    // mesmo com rede ruim) e confirma o token com a API em segundo plano:
    // se ele tiver expirado, o interceptor 401 chama signOut.
    (async () => {
      const [token, savedUser] = await Promise.all([getItem(TOKEN_KEY), getItem(USER_KEY)]);

      if (token && savedUser) {
        setApiToken(token);
        setUser(JSON.parse(savedUser));
        api.get<User>("/me").catch(() => {});
      }

      setIsLoading(false);
    })();
  }, []);

  async function signIn(email: string, password: string) {
    const { data } = await api.post<Session>("/session", { email, password });
    const { token, ...userData } = data;

    await Promise.all([setItem(TOKEN_KEY, token), setItem(USER_KEY, JSON.stringify(userData))]);
    setApiToken(token);
    setUser(userData);
  }

  return <AuthContext value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }
  return context;
}
