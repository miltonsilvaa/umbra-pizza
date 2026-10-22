import { prisma } from "../../lib/prisma";
import { emitOrderEvent } from "../../lib/socket";
import { AppError } from "../../errors/AppError";
import { findOrderOrFail } from "./orderGuards";

export class FinishOrderService {
  async execute(order_id: string) {
    const current = await findOrderOrFail(order_id);

    if (current.draft) {
      throw new AppError("Pedido ainda não foi enviado para a cozinha");
    }

    if (current.status) {
      throw new AppError("Pedido já foi concluído");
    }

    const order = await prisma.order.update({
      where: { id: order_id },
      data: { status: true },
    });

    emitOrderEvent("order:finished", { id: order.id });

    return order;
  }
}
