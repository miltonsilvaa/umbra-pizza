import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full rounded-lg border border-line bg-surface px-4 text-foreground placeholder:text-muted " +
  "outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30";

interface FieldProps {
  label: string;
  id: string;
}

export function Input({ label, id, className = "", ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <input id={id} name={id} className={`${base} h-12 ${className}`} {...props} />
    </div>
  );
}

export function TextArea({ label, id, className = "", ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <textarea id={id} name={id} className={`${base} min-h-28 resize-y py-3 ${className}`} {...props} />
    </div>
  );
}
