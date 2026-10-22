import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { emitOrderEvent } from "../../lib/socket";
import { findReadyOrderOrFail } from "./orderGuards";

export class CloseOrderService {
  async execute(order_id: string) {
    await findReadyOrderOrFail(order_id);

    const items = await prisma.item.findMany({
      where: { order_id },
      include: { product: { select: { price: true } } },
    });

    // Decimal evita erros de ponto flutuante (ex: 0.1 + 0.2)
    const total = items.reduce(
      (sum, item) => sum.plus(item.product.price.times(item.amount)),
      new Prisma.Decimal(0),
    );

    const order = await prisma.order.update({
      where: { id: order_id },
      data: { status: "CLOSED", closed_at: new Date() },
    });

    emitOrderEvent("order:closed", { id: order.id });

    return { ...order, total };
  }
}
