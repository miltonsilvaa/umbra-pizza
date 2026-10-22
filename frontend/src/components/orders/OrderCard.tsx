import { Clock, ShoppingBag } from "lucide-react";
import { minutesSince } from "@/lib/format";
import type { OrderListItem } from "@/types";

/** Cor da borda pelo tempo de espera: verde até 10 min, amarelo até 20, vermelho depois. */
function urgency(minutes: number) {
  if (minutes < 10) return { bar: "bg-success", text: "text-success" };
  if (minutes < 20) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-brand", text: "text-brand" };
}

interface OrderCardProps {
  order: OrderListItem;
  now: number;
  onSelect: (id: string) => void;
}

export function OrderCard({ order, now, onSelect }: OrderCardProps) {
  const minutes = minutesSince(order.updated_at, now);
  const color = urgency(minutes);
  const items = order._count.items;

  return (
    <button
      onClick={() => onSelect(order.id)}
      className="group relative flex animate-pop-in cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface p-5 pl-6 text-left transition hover:-translate-y-0.5 hover:border-muted/40 hover:bg-surface-hover focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none"
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${color.bar}`} />

      <span className="text-sm text-muted">Mesa</span>
      <span className="text-4xl leading-tight font-bold">{order.table}</span>
      <span className="mt-1 truncate text-sm text-muted">{order.name || "Sem nome"}</span>

      <span className="mt-4 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <ShoppingBag size={16} aria-hidden />
          {items} {items === 1 ? "item" : "itens"}
        </span>
        <span className={`flex items-center gap-1.5 font-medium ${color.text}`}>
          <Clock size={16} aria-hidden />
          {minutes === 0 ? "agora" : `${minutes} min`}
        </span>
      </span>
    </button>
  );
}
