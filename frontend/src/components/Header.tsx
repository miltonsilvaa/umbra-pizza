"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LogOut, Pizza, Tags, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/ui/Logo";

const links = [
  { href: "/dashboard", label: "Pedidos", icon: ClipboardList },
  { href: "/dashboard/caixa", label: "Caixa", icon: Wallet },
  { href: "/dashboard/category", label: "Categorias", icon: Tags },
  { href: "/dashboard/product", label: "Produtos", icon: Pizza },
];

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/dashboard" aria-label="Ir para os pedidos">
          <Logo />
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 " +
                  (active ? "bg-surface text-foreground" : "text-muted hover:text-foreground")
                }
              >
                <Icon size={18} aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <div className="mx-2 hidden h-6 w-px bg-line sm:block" aria-hidden />

          {user && <span className="hidden text-sm text-muted md:inline">Olá, {user.name.split(" ")[0]}</span>}

          <button
            onClick={signOut}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:text-brand sm:px-3"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={18} aria-hidden />
          </button>
        </nav>
      </div>
    </header>
  );
}
