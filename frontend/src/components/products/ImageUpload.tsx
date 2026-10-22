"use client";

import { useEffect, useMemo } from "react";
import type { ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // mesmo limite do backend

interface ImageUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

export function ImageUpload({ file, onChange }: ImageUploadProps) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  // Libera a memória da URL anterior quando a imagem muda ou o componente sai
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!selected) return;

    if (!ACCEPTED.includes(selected.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      toast.error("A imagem precisa ter no máximo 5MB.");
      return;
    }
    onChange(selected);
  }

  return (
    <label
      htmlFor="banner"
      className="group relative flex h-56 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface transition-colors hover:border-brand focus-within:border-brand"
    >
      <input id="banner" type="file" accept={ACCEPTED.join(",")} onChange={handleChange} className="sr-only" />

      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: local, next/image não se aplica */}
          <img src={preview} alt="Pré-visualização do produto" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 font-medium opacity-0 transition-opacity group-hover:opacity-100">
            <ImagePlus size={22} aria-hidden /> Trocar imagem
          </span>
        </>
      ) : (
        <span className="flex flex-col items-center gap-2 text-muted transition-colors group-hover:text-foreground">
          <ImagePlus size={40} className="text-brand" aria-hidden />
          <span className="font-medium">Clique para enviar a foto</span>
          <span className="text-xs">JPG, PNG ou WEBP · até 5MB</span>
        </span>
      )}
    </label>
  );
}
