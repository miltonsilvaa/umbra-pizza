"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { getToken, removeToken, setToken } from "@/lib/cookies";
import type { Session, User } from "@/types";

interface SignInData {
  email: string;
  password: string;
}

interface SignUpData extends SignInData {
  name: string;
}

interface AuthContextData {
  user: User | null;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Recarregou a página com token salvo? Confirma na API se ele ainda vale.
  // Se não valer, o interceptor do axios limpa o cookie e manda para o login.
  useEffect(() => {
    if (!getToken()) return;

    api
      .get<User>("/me")
      .then(({ data }) => setUser(data))
      .catch(() => {});
  }, []);

  const signIn = useCallback(
    async ({ email, password }: SignInData) => {
      const { data } = await api.post<Session>("/session", { email, password });
      const { token, ...userData } = data;

      setToken(token);
      setUser(userData);
      router.push("/dashboard");
    },
    [router],
  );

  const signUp = useCallback(async ({ name, email, password }: SignUpData) => {
    await api.post("/users", { name, email, password });
  }, []);

  const signOut = useCallback(() => {
    removeToken();
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext value={{ user, signIn, signUp, signOut }}>{children}</AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }
  return context;
}
