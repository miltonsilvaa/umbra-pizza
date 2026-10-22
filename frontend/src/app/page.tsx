"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/services/api";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

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

  return (
    <AuthShell subtitle="Acesse o painel da cozinha">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="email" label="E-mail" type="email" placeholder="voce@pizzaria.com" autoComplete="email" required autoFocus />
        <Input id="password" label="Senha" type="password" placeholder="••••••" autoComplete="current-password" required />

        <Button type="submit" loading={loading} className="mt-2">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Não possui conta?{" "}
        <Link href="/signup" className="font-semibold text-foreground underline-offset-4 hover:text-brand hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthShell>
  );
}
