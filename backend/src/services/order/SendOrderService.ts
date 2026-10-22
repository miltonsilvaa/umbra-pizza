import { prisma } from "../../lib/prisma";
import { emitOrderEvent } from "../../lib/socket";
import { AppError } from "../../errors/AppError";
import { findDraftOrderOrFail } from "./orderGuards";

export class SendOrderService {
  async execute(order_id: string) {
    await findDraftOrderOrFail(order_id);

    const itemsCount = await prisma.item.count({ where: { order_id } });

    if (itemsCount === 0) {
      throw new AppError("Adicione ao menos um item antes de enviar o pedido");
    }

    const order = await prisma.order.update({
      where: { id: order_id },
      data: { status: "SENT" },
    });

    emitOrderEvent("order:sent", order);

    return order;
  }
}
