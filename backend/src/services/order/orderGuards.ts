import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

export async function findOrderOrFail(order_id: string) {
  const order = await prisma.order.findUnique({ where: { id: order_id } });

  if (!order) {
    throw new AppError("Pedido não encontrado", 404);
  }

  return order;
}

/** Garante que o pedido ainda está sendo montado pelo garçom. */
export async function findDraftOrderOrFail(order_id: string) {
  const order = await findOrderOrFail(order_id);

  if (!order.draft) {
    throw new AppError("Pedido já foi enviado para a cozinha e não pode ser alterado");
  }

  return order;
}
