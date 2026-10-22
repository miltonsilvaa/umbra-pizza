import { Pizza } from "lucide-react";

/** Marca do sistema — troque o nome aqui para personalizar a pizzaria. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-4xl" : "text-2xl";
  const icon = size === "lg" ? 40 : 28;

  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${text}`}>
      <Pizza size={icon} className="text-brand" strokeWidth={2.25} aria-hidden />
      <span>
        umbra<span className="text-brand">pizza</span>
      </span>
    </span>
  );
}
