import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, getErrorMessage } from "@/services/api";
import { showError } from "@/lib/feedback";
import { formatPrice } from "@/lib/format";
import { colors, radius } from "@/constants/theme";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { QuantityStepper } from "@/components/QuantityStepper";
import { SelectField } from "@/components/SelectField";
import type { Category, OrderItem, Product } from "@/types";

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const { id, table, name } = useLocalSearchParams<{ id: string; table: string; name?: string }>();

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [amount, setAmount] = useState(1);

  const [items, setItems] = useState<OrderItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // Categorias: carrega uma vez e já seleciona a primeira
  useEffect(() => {
    api
      .get<Category[]>("/category")
      .then(({ data }) => {
        setCategories(data);
        setCategoryId(data[0]?.id ?? null);
      })
      .catch((error) => {
        setCategories([]);
        showError(getErrorMessage(error));
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
        setProductId(data[0]?.id ?? null);
      })
      .catch((error) => !cancelled && showError(getErrorMessage(error)));

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  function handleSelectCategory(newId: string) {
    if (newId === categoryId) return;
    setProducts(null);
    setProductId(null);
    setCategoryId(newId);
  }

  async function handleAddItem() {
    if (!productId) return;

    setAdding(true);
    try {
      const { data } = await api.post<OrderItem>("/order/add", { order_id: id, product_id: productId, amount });
      setItems((current) => [...current, data]);
      setAmount(1);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    setRemovingId(itemId);
    try {
      await api.delete("/order/remove", { params: { item_id: itemId } });
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setRemovingId(null);
    }
  }

  /** Apaga o rascunho na API — senão ele fica órfão no banco. */
  async function discardOrder() {
    setDiscarding(true);
    try {
      await api.delete("/order", { params: { order_id: id } });
      setConfirmOpen(false);
      router.back();
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setDiscarding(false);
    }
  }

  /** "X" do cabeçalho e botão voltar do Android: mesa vazia sai direto; com itens, pergunta. */
  function handleClose() {
    if (items.length === 0) {
      discardOrder();
    } else {
      setConfirmOpen(true);
    }
  }

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        handleClose();
        return true;
      });
      return () => subscription.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- handleClose muda a cada render; o que importa é a lista de itens
    }, [items.length]),
  );

  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.amount, 0);
  const selectedProduct = products?.find((p) => p.id === productId);

  const header = (
    <View style={styles.form}>
      {name ? <Text style={styles.client}>Cliente: {name}</Text> : null}

      <SelectField
        label="Categoria"
        placeholder={categories ? "Selecione a categoria" : "Carregando..."}
        options={(categories ?? []).map((c) => ({ id: c.id, label: c.name }))}
        selectedId={categoryId}
        onSelect={handleSelectCategory}
        disabled={!categories?.length}
        emptyText="Nenhuma categoria cadastrada no painel"
      />

      <SelectField
        label="Produto"
        placeholder={!categoryId ? "Escolha uma categoria" : products ? "Selecione o produto" : "Carregando..."}
        options={(products ?? []).map((p) => ({ id: p.id, label: p.name, detail: formatPrice(p.price) }))}
        selectedId={productId}
        onSelect={setProductId}
        disabled={!products?.length}
        emptyText="Nenhum produto nesta categoria"
      />

      <View style={styles.addRow}>
        <View style={styles.flex}>
          <QuantityStepper value={amount} onChange={setAmount} />
        </View>
        <Button
          title="Adicionar"
          onPress={handleAddItem}
          loading={adding}
          disabled={!productId}
          icon={<Ionicons name="add" size={22} color={colors.foreground} />}
          style={styles.addButton}
        />
      </View>

      {selectedProduct && (
        <Text style={styles.preview}>
          {amount}x {selectedProduct.name} = {formatPrice(Number(selectedProduct.price) * amount)}
        </Text>
      )}

      <Text style={styles.sectionTitle}>Itens da mesa ({items.length})</Text>
    </View>
  );

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          title: `Mesa ${table}`,
          headerLeft: () => (
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fechar mesa"
              style={styles.headerButton}
            >
              <Ionicons name="close" size={26} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={36} color={colors.muted} />
            <Text style={styles.emptyText}>Nenhum item lançado ainda.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemAmount}>{item.amount}x</Text>
            <View style={styles.flex}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={styles.itemPrice}>{formatPrice(Number(item.product.price) * item.amount)}</Text>
            </View>
            <Pressable
              onPress={() => handleRemoveItem(item.id)}
              disabled={removingId === item.id}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${item.product.name}`}
              style={styles.removeButton}
            >
              {removingId === item.id ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <Ionicons name="trash-outline" size={22} color={colors.brand} />
              )}
            </Pressable>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View>
          <Text style={styles.footerLabel}>Subtotal</Text>
          <Text style={styles.footerTotal}>{formatPrice(subtotal)}</Text>
        </View>
        <Button
          title="Avançar"
          onPress={() => router.push({ pathname: "/order/[id]/finish", params: { id, table, name: name ?? "" } })}
          disabled={items.length === 0}
          icon={<Ionicons name="arrow-forward" size={20} color={colors.foreground} />}
          style={styles.flex}
        />
      </View>

      <ConfirmModal
        visible={confirmOpen}
        title={`Descartar mesa ${table}?`}
        message={`O pedido ainda não foi enviado. ${items.length === 1 ? "O item lançado será apagado." : `Os ${items.length} itens lançados serão apagados.`}`}
        confirmLabel="Descartar"
        loading={discarding}
        onConfirm={discardOrder}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerButton: { paddingRight: 8 },
  list: { padding: 20, paddingBottom: 32 },
  form: { gap: 16, marginBottom: 12 },
  client: { color: colors.muted, fontSize: 15 },
  addRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  addButton: { paddingHorizontal: 18 },
  preview: { color: colors.muted, fontSize: 14, textAlign: "center" },
  sectionTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 16,
  },
  empty: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyText: { color: colors.muted, fontSize: 15 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  itemAmount: {
    minWidth: 44,
    textAlign: "center",
    color: colors.brand,
    fontWeight: "800",
    fontSize: 16,
    backgroundColor: "rgba(255,63,75,0.12)",
    borderRadius: radius.sm,
    paddingVertical: 8,
    overflow: "hidden",
  },
  itemName: { color: colors.foreground, fontSize: 16, fontWeight: "600" },
  itemPrice: { color: colors.muted, fontSize: 14, marginTop: 2 },
  removeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.background,
  },
  footerLabel: { color: colors.muted, fontSize: 13 },
  footerTotal: { color: colors.foreground, fontSize: 20, fontWeight: "800" },
});
