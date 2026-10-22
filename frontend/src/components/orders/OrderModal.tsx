"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/services/api";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import type { OrderDetail } from "@/types";

interface OrderModalProps {
  orderId: string;
  onClose: () => void;
  onFinished: (id: string) => void;
}

/**
 * Detalhe do pedido em um <dialog> nativo: o navegador já cuida do foco,
 * da tecla Esc e de bloquear a página por trás.
 * O pai monta este componente só quando há um pedido selecionado (e fecha desmontando).
 */
export function OrderModal({ orderId, onClose, onFinished }: OrderModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();

    let cancelled = false;
    api
      .get<OrderDetail>("/order/detail", { params: { order_id: orderId } })
      .then(({ data }) => !cancelled && setOrder(data))
      .catch((error) => {
        toast.error(getErrorMessage(error));
        onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, onClose]);

  async function handleFinish() {
    if (!order) return;

    setFinishing(true);
    try {
      await api.put("/order/finish", { order_id: order.id });
      toast.success(`Mesa ${order.table} concluída!`);
      onFinished(order.id);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setFinishing(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // clique fora do conteúdo (no backdrop) fecha
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="order-modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-line bg-surface p-0 text-foreground shadow-2xl shadow-black/60 open:animate-pop-in"
    >
      {!order ? (
        <div className="flex h-64 items-center justify-center">
          <LoaderCircle size={32} className="animate-spin text-brand" aria-label="Carregando pedido" />
        </div>
      ) : (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-line p-6">
            <div>
              <h2 id="order-modal-title" className="text-2xl font-bold">
                Mesa {order.table}
              </h2>
              <p className="text-muted">{order.name || "Cliente sem nome"}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X size={22} />
            </button>
          </header>

          <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4">
                <span className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-brand/15 font-bold text-brand">
                  {item.amount}x
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.product.name}</p>
                  <p className="text-sm text-muted">{item.product.description}</p>
                </div>
                <span className="text-sm whitespace-nowrap text-muted">
                  {formatPrice(Number(item.product.price) * item.amount)}
                </span>
              </li>
            ))}
          </ul>

          <footer className="flex flex-col gap-4 border-t border-line p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">
              Total <span className="ml-1 text-xl font-bold text-foreground">{formatPrice(order.total)}</span>
            </p>
            <Button variant="success" onClick={handleFinish} loading={finishing}>
              <CheckCircle2 size={20} aria-hidden />
              Concluir pedido
            </Button>
          </footer>
        </div>
      )}
    </dialog>
  );
}
