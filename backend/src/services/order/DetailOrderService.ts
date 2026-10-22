import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

export class DetailOrderService {
  async execute(order_id: string) {
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        items: {
          orderBy: { created_at: "asc" },
          include: {
            product: {
              select: { id: true, name: true, price: true, description: true, banner: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Pedido não encontrado", 404);
    }

    // Decimal evita erros de ponto flutuante (ex: 0.1 + 0.2)
    const total = order.items.reduce(
      (sum, item) => sum.plus(item.product.price.times(item.amount)),
      new Prisma.Decimal(0),
    );

    return { ...order, total };
  }
}
