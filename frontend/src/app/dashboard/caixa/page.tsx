"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/services/api";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";
import { CaixaCard } from "@/components/caixa/CaixaCard";
import type { ActiveOrder } from "@/types";

export default function CaixaPage() {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const loadOrders = useCallback(
    () =>
      api
        .get<ActiveOrder[]>("/order/active")
        .then(({ data }) => setOrders(data))
        .catch((error) => toast.error(getErrorMessage(error)))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const removeOrder = useCallback((id: string) => {
    setOrders((current) => current.filter((order) => order.id !== id));
  }, []);

  // Mesas abertas/enviadas/concluídas pela cozinha só mudam de estado aqui dentro —
  // qualquer um desses eventos pode afetar a lista, então ela é recarregada por completo.
  const live = useOrdersSocket({
    onSent: () => loadOrders(),
    onFinished: () => loadOrders(),
    onClosed: ({ id }) => removeOrder(id),
  });

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  async function handleClose(id: string) {
    setClosingId(id);
    try {
      await api.patch("/order/close", { order_id: id });
      removeOrder(id);
      toast.success("Conta fechada!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setClosingId(null);
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            Caixa
            {!loading && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-base font-semibold">{orders.length}</span>
            )}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-success" : "bg-muted"}`}
            />
            {live ? "Ao vivo — a lista se atualiza sozinha" : "Desconectado — use o botão atualizar"}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-hover disabled:opacity-60"
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin text-brand" : "text-brand"} aria-hidden />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-20 text-center">
          <Wallet size={56} className="mb-4 text-muted" aria-hidden />
          <p className="text-lg font-semibold">Nenhuma mesa ativa</p>
          <p className="text-muted">Mesas abertas pelos garçons aparecem aqui até o pagamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <CaixaCard key={order.id} order={order} closing={closingId === order.id} onClose={handleClose} />
          ))}
        </div>
      )}
    </>
  );
}
