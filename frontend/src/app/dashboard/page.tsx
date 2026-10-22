"use client";

import { useCallback, useEffect, useState } from "react";
import { ChefHat, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/services/api";
import { useOrdersSocket } from "@/hooks/useOrdersSocket";
import { playNewOrderSound } from "@/lib/notify";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderModal } from "@/components/orders/OrderModal";
import type { OrderListItem } from "@/types";

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Relógio dos cards. Começa em 0 (Date.now() no render quebra o prerender do
  // Next) e é preenchido junto com os pedidos — os cards só aparecem depois disso.
  const [now, setNow] = useState(0);

  const loadOrders = useCallback(
    () =>
      api
        .get<OrderListItem[]>("/orders")
        .then(({ data }) => {
          setOrders(data);
          setNow(Date.now());
        })
        .catch((error) => toast.error(getErrorMessage(error)))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Atualiza o "há X min" dos cards a cada 30s
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const removeOrder = useCallback((id: string) => {
    setOrders((current) => current.filter((order) => order.id !== id));
  }, []);

  const live = useOrdersSocket({
    onSent: (order) => {
      playNewOrderSound();
      toast(`Novo pedido — Mesa ${order.table}`, { icon: "🍕" });
      loadOrders();
    },
    onFinished: ({ id }) => removeOrder(id),
  });

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  const closeModal = useCallback(() => setSelectedId(null), []);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            Últimos pedidos
            {!loading && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-base font-semibold">{orders.length}</span>
            )}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-success" : "bg-muted"}`}
            />
            {live ? "Ao vivo — novos pedidos aparecem sozinhos" : "Desconectado — use o botão atualizar"}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-20 text-center">
          <ChefHat size={56} className="mb-4 text-muted" aria-hidden />
          <p className="text-lg font-semibold">Nenhum pedido na fila</p>
          <p className="text-muted">Os pedidos enviados pelos garçons aparecem aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} now={now} onSelect={setSelectedId} />
          ))}
        </div>
      )}

      {/* key: cada pedido monta um modal novo, com estado limpo */}
      {selectedId && (
        <OrderModal key={selectedId} orderId={selectedId} onClose={closeModal} onFinished={removeOrder} />
      )}
    </>
  );
}
