import { Sparkles } from "lucide-react";

/** Aviso fixo no topo do painel — este sistema é a instância pública de demonstração do portfólio. */
export function DemoBanner() {
  return (
    <div className="border-b border-brand/30 bg-brand/10 px-4 py-3 text-center text-sm text-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <Sparkles size={16} className="text-brand" aria-hidden />
        <span>
          Você está no <strong>ambiente de demonstração</strong>. Sinta-se à vontade para testar os fluxos de
          lançamento de pedidos e fechamento de caixa.
        </span>
      </div>
    </div>
  );
}
