import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** Moldura das telas de login e cadastro. */
export function AuthShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      {/* brilho vermelho sutil atrás do card */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-pop-in">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size="lg" />
          <p className="text-muted">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface/60 p-6 shadow-2xl shadow-black/40 sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
