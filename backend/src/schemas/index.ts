import { z } from "zod";

// ---------- Usuário ----------
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
});

export const authUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

// ---------- Categoria ----------
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria"),
});

// ---------- Produto ----------
// Vem como multipart/form-data, então tudo chega como string → coerce
export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto"),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  description: z.string().trim().min(1, "Informe a descrição"),
  category_id: z.string().uuid("Categoria inválida"),
});

export const listByCategorySchema = z.object({
  category_id: z.string().uuid("Categoria inválida"),
});

// ---------- Pedido ----------
export const createOrderSchema = z.object({
  table: z.coerce.number().int().positive("Número da mesa inválido"),
  name: z.string().trim().optional(),
});

export const orderIdSchema = z.object({
  order_id: z.string().uuid("Pedido inválido"),
});

export const addItemSchema = z.object({
  order_id: z.string().uuid("Pedido inválido"),
  product_id: z.string().uuid("Produto inválido"),
  amount: z.coerce.number().int().positive("Quantidade inválida"),
});

export const itemIdSchema = z.object({
  item_id: z.string().uuid("Item inválido"),
});
