export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session extends User {
  token: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  /** Decimal do Prisma chega como string no JSON — use Number(price) */
  price: string;
  description: string;
  banner: string;
  category_id: string;
}

export interface Order {
  id: string;
  table: number;
  status: boolean;
  draft: boolean;
  name: string | null;
}

export interface OrderItem {
  id: string;
  amount: number;
  order_id: string;
  product_id: string;
  product: Pick<Product, "id" | "name" | "price">;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  /** Decimal do Prisma chega como string no JSON */
  total: string;
}
