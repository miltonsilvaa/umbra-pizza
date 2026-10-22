"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/services/api";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setLoading(true);
    try {
      await signUp({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      toast.success("Conta criada! Faça login para continuar.");
      router.push("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <AuthShell subtitle="Crie a conta da equipe">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="name" label="Nome" placeholder="Seu nome" autoComplete="name" required minLength={2} autoFocus />
        <Input id="email" label="E-mail" type="email" placeholder="voce@pizzaria.com" autoComplete="email" required />
        <Input id="password" label="Senha" type="password" placeholder="Mínimo de 6 caracteres" autoComplete="new-password" required minLength={6} />

        <Button type="submit" loading={loading} className="mt-2">
          Cadastrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Já possui conta?{" "}
        <Link href="/" className="font-semibold text-foreground underline-offset-4 hover:text-brand hover:underline">
          Fazer login
        </Link>
      </p>
    </AuthShell>
  );
}
