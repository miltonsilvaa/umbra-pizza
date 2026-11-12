"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Minus, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/services/api";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import type { Category, OrderDetail, Product } from "@/types";

/** Tela web equivalente ao "lançar itens" do app do garçom — só funciona em mesas DRAFT (ainda não enviadas à cozinha). */
export default function LaunchOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState(1);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadOrder = useCallback(
    () =>
      api
        .get<OrderDetail>("/order/detail", { params: { order_id: id } })
        .then(({ data }) => setOrder(data))
        .catch((error) => toast.error(getErrorMessage(error)))
        .finally(() => setLoading(false)),
    [id],
  );

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Categorias: carrega uma vez e já seleciona a primeira
  useEffect(() => {
    api
      .get<Category[]>("/category")
      .then(({ data }) => {
        setCategories(data);
        setCategoryId(data[0]?.id ?? "");
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        setCategories([]);
      });
  }, []);

  // Produtos: recarrega quando a categoria muda e seleciona o primeiro
  useEffect(() => {
    if (!categoryId) return;

    let cancelled = false;
    api
      .get<Product[]>("/category/product", { params: { category_id: categoryId } })
      .then(({ data }) => {
        if (cancelled) return;
        setProducts(data);
        setProductId(data[0]?.id ?? "");
      })
      .catch((error) => !cancelled && toast.error(getErrorMessage(error)));

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  async function handleAddItem() {
    if (!productId) return;

    setAdding(true);
    try {
      await api.post("/order/add", { order_id: id, product_id: productId, amount });
      setAmount(1);
      await loadOrder();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    setRemovingId(itemId);
    try {
      await api.delete("/order/remove", { params: { item_id: itemId } });
      await loadOrder();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSend() {
    if (!order) return;

    setSending(true);
    try {
      await api.put("/order/send", { order_id: order.id });
      toast.success(`Mesa ${order.table} enviada para a cozinha!`);
      router.push("/dashboard/caixa");
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSending(false);
    }
  }

  const selectedProduct = products?.find((p) => p.id === productId);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  if (!order) return null;

  if (order.status !== "DRAFT") {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-line py-16 text-center">
        <p className="text-lg font-semibold">Mesa {order.table} já foi enviada para a cozinha</p>
        <p className="mt-1 text-muted">Pedidos em preparo não podem receber novos itens.</p>
        <Link href="/dashboard/caixa" className="mt-6 inline-block font-semibold text-brand hover:underline">
          ← Voltar para o Caixa
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/caixa"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} aria-hidden />
        Voltar para o Caixa
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Mesa {order.table}</h1>
      <p className="mt-1 text-muted">{order.name || "Lance os itens e envie para a cozinha"}</p>

      {categories && categories.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-lg font-semibold">Nenhuma categoria cadastrada</p>
          <p className="mt-1 text-muted">Cadastre categorias e produtos antes de lançar itens.</p>
          <Link href="/dashboard/category" className="mt-6 inline-block font-semibold text-brand hover:underline">
            Ir para categorias →
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-medium text-muted">
              Categoria
            </label>
            <div className="relative">
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!categories?.length}
                className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-line bg-background px-4 pr-10 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
              >
                {!categories?.length && <option>Carregando...</option>}
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product" className="text-sm font-medium text-muted">
              Produto
            </label>
            <div className="relative">
              <select
                id="product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={!products?.length}
                className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-line bg-background px-4 pr-10 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
              >
                {!products?.length && (
                  <option>{categoryId ? "Nenhum produto nesta categoria" : "Escolha uma categoria"}</option>
                )}
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {formatPrice(product.price)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">Qtd.</span>
              <div className="flex h-12 items-center rounded-lg border border-line bg-background">
                <button
                  type="button"
                  onClick={() => setAmount((a) => Math.max(1, a - 1))}
                  className="flex h-full w-10 cursor-pointer items-center justify-center text-muted transition-colors hover:text-foreground"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold" aria-live="polite">
                  {amount}
                </span>
                <button
                  type="button"
                  onClick={() => setAmount((a) => a + 1)}
                  className="flex h-full w-10 cursor-pointer items-center justify-center text-muted transition-colors hover:text-foreground"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <Button type="button" onClick={handleAddItem} loading={adding} disabled={!productId} className="flex-1">
              <Plus size={18} aria-hidden />
              Adicionar
            </Button>
          </div>

          {selectedProduct && (
            <p className="text-center text-sm text-muted">
              {amount}x {selectedProduct.name} = {formatPrice(Number(selectedProduct.price) * amount)}
            </p>
          )}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold tracking-wide text-muted uppercase">
        Itens da mesa ({order.items.length})
      </h2>

      {order.items.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-line py-10 text-center text-muted">
          Nenhum item lançado ainda.
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <span className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-brand/15 font-bold text-brand">
                {item.amount}x
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.product.name}</p>
                <p className="text-sm text-muted">{formatPrice(Number(item.product.price) * item.amount)}</p>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={removingId === item.id}
                aria-label={`Remover ${item.product.name}`}
                className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">Total</p>
          <p className="text-2xl font-bold">{formatPrice(order.total)}</p>
        </div>
        <Button variant="success" onClick={handleSend} loading={sending} disabled={order.items.length === 0}>
          <Send size={18} aria-hidden />
          Enviar para a cozinha
        </Button>
      </div>
    </div>
  );
}
