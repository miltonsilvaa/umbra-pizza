import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export class ListActiveOrdersService {
  /** Caixa: mesas abertas (DRAFT/SENT) ou aguardando pagamento (READY), com o total de cada uma. */
  async execute() {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["DRAFT", "SENT", "READY"] } },
      orderBy: { updated_at: "asc" },
      include: { items: { include: { product: { select: { price: true } } } } },
    });

    return orders.map(({ items, ...order }) => {
      const total = items.reduce(
        (sum, item) => sum.plus(item.product.price.times(item.amount)),
        new Prisma.Decimal(0),
      );

      return { ...order, itemsCount: items.length, total };
    });
  }
}
