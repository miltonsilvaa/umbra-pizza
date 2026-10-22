"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/types";

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<Category[]>("/category")
      .then(({ data }) => setCategories(data))
      .catch((error) => toast.error(getErrorMessage(error)));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const name = String(new FormData(formElement).get("name")).trim();
    if (!name) return;

    setLoading(true);
    try {
      const { data } = await api.post<Category>("/category", { name });
      setCategories((current) =>
        [...current, data].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      );
      toast.success(`Categoria "${data.name}" cadastrada!`);
      formElement.reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Nova categoria</h1>
      <p className="mt-1 text-muted">Organize o cardápio em grupos como Pizzas, Bebidas e Sobremesas.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input id="name" label="Nome da categoria" placeholder="Ex: Pizzas salgadas" required autoFocus />
        </div>
        <Button type="submit" loading={loading}>
          Cadastrar
        </Button>
      </form>

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted uppercase">
          Categorias cadastradas ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <p className="text-muted">Nenhuma categoria ainda.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex animate-pop-in items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm"
              >
                <Tag size={14} className="text-brand" aria-hidden />
                {category.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
