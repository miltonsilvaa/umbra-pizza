import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { findDraftOrderOrFail } from "./orderGuards";

export class RemoveItemService {
  async execute(item_id: string) {
    const item = await prisma.item.findUnique({ where: { id: item_id } });

    if (!item) {
      throw new AppError("Item não encontrado", 404);
    }

    await findDraftOrderOrFail(item.order_id);

    return prisma.item.delete({ where: { id: item_id } });
  }
}
