"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/services/api";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const DEMO_CREDENTIALS = { email: "demo@umbrapizza.com", password: "demo123" };

export default function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setLoading(true);
    try {
      await signIn({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      await signIn(DEMO_CREDENTIALS);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDemoLoading(false);
    }
  }

  return (
    <AuthShell subtitle="Acesse o painel da cozinha">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="email" label="E-mail" type="email" placeholder="voce@pizzaria.com" autoComplete="email" required autoFocus />
        <Input id="password" label="Senha" type="password" placeholder="••••••" autoComplete="current-password" required />

        <Button type="submit" loading={loading} disabled={demoLoading} className="mt-2">
          Entrar
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3" aria-hidden>
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium text-muted">ou</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="ghost"
        loading={demoLoading}
        disabled={loading}
        onClick={handleDemoLogin}
        className="w-full border-brand/40 text-brand hover:bg-brand/10"
      >
        <Sparkles size={18} aria-hidden />
        Entrar com Conta de Demonstração
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        Não possui conta?{" "}
        <Link href="/signup" className="font-semibold text-foreground underline-offset-4 hover:text-brand hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthShell>
  );
}
