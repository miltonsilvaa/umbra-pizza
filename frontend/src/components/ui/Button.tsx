import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "success" | "ghost";
}

const variants = {
  primary: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand/40",
  success: "bg-success text-background hover:brightness-90 focus-visible:ring-success/40",
  ghost: "bg-surface text-foreground border border-line hover:bg-surface-hover focus-visible:ring-line",
};

export function Button({
  loading = false,
  variant = "primary",
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      className={
        "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg px-6 font-semibold " +
        "outline-none transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 " +
        `${variants[variant]} ${className}`
      }
      {...props}
    >
      {loading ? <LoaderCircle size={20} className="animate-spin" aria-label="Carregando" /> : children}
    </button>
  );
}
