"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { ImageUpload } from "@/components/products/ImageUpload";
import type { Category, Product } from "@/types";

export default function ProductPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<Category[]>("/category")
      .then(({ data }) => setCategories(data))
      .catch((error) => {
        toast.error(getErrorMessage(error));
        setCategories([]);
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (!file) {
      toast.error("Envie a foto do produto.");
      return;
    }

    const form = new FormData(formElement);
    // Aceita "45,90" (padrão brasileiro) além de "45.90"
    form.set("price", String(form.get("price")).replace(",", "."));
    form.set("file", file);

    setLoading(true);
    try {
      const { data } = await api.post<Product>("/product", form);
      toast.success(`"${data.name}" cadastrado!`);
      formElement.reset();
      setFile(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  if (categories && categories.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-line py-16 text-center">
        <p className="text-lg font-semibold">Cadastre uma categoria primeiro</p>
        <p className="mt-1 text-muted">Todo produto precisa pertencer a uma categoria.</p>
        <Link href="/dashboard/category" className="mt-6 inline-block font-semibold text-brand hover:underline">
          Ir para categorias →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Novo produto</h1>
      <p className="mt-1 text-muted">Pizzas, bebidas e tudo que o garçom pode lançar na mesa.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <ImageUpload file={file} onChange={setFile} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category_id" className="text-sm font-medium text-muted">
            Categoria
          </label>
          <div className="relative">
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue=""
              disabled={!categories}
              className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface px-4 pr-10 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            >
              <option value="" disabled>
                {categories ? "Selecione a categoria" : "Carregando..."}
              </option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" aria-hidden />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
          <Input id="name" label="Nome" placeholder="Ex: Pizza Calabresa" required />
          <Input id="price" label="Preço (R$)" placeholder="45,90" inputMode="decimal" pattern="^\d+([.,]\d{1,2})?$" title="Use números, ex: 45,90" required />
        </div>

        <TextArea id="description" label="Descrição" placeholder="Molho de tomate, mussarela, calabresa e cebola" required />

        <Button type="submit" loading={loading} className="mt-2">
          Cadastrar produto
        </Button>
      </form>
    </div>
  );
}
