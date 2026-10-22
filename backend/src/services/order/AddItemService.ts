import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { findDraftOrderOrFail } from "./orderGuards";

interface Request {
  order_id: string;
  product_id: string;
  amount: number;
}

export class AddItemService {
  async execute({ order_id, product_id, amount }: Request) {
    await findDraftOrderOrFail(order_id);

    const product = await prisma.product.findUnique({ where: { id: product_id } });

    if (!product) {
      throw new AppError("Produto não encontrado", 404);
    }

    return prisma.item.create({
      data: { order_id, product_id, amount },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
  }
}
