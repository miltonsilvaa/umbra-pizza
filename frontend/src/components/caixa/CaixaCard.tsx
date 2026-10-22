import { Wallet } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import type { ActiveOrder, OrderStatus } from "@/types";

const statusInfo: Record<OrderStatus, { label: string; dot: string }> = {
  DRAFT: { label: "Mesa sendo montada", dot: "bg-muted" },
  SENT: { label: "Em preparo na cozinha", dot: "bg-warning" },
  READY: { label: "Aguardando pagamento", dot: "bg-success" },
  CLOSED: { label: "Fechada", dot: "bg-muted" },
};

interface CaixaCardProps {
  order: ActiveOrder;
  closing: boolean;
  onClose: (id: string) => void;
}

export function CaixaCard({ order, closing, onClose }: CaixaCardProps) {
  const info = statusInfo[order.status];
  const canClose = order.status === "READY";

  return (
    <div className="flex animate-pop-in flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-sm text-muted">Mesa</span>
          <p className="text-3xl leading-tight font-bold">{order.table}</p>
          <p className="truncate text-sm text-muted">{order.name || "Sem nome"}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <span aria-hidden className={`h-2 w-2 rounded-full ${info.dot}`} />
          {info.label}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <div>
          <p className="text-xs text-muted">
            {order.itemsCount} {order.itemsCount === 1 ? "item" : "itens"}
          </p>
          <p className="text-xl font-bold">{formatPrice(order.total)}</p>
        </div>

        <Button
          onClick={() => onClose(order.id)}
          disabled={!canClose}
          loading={closing}
          title={canClose ? undefined : "Aguardando a cozinha concluir o pedido"}
        >
          <Wallet size={18} aria-hidden />
          Fechar conta
        </Button>
      </div>
    </div>
  );
}
