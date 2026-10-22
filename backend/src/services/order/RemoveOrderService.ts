import { prisma } from "../../lib/prisma";
import { findDraftOrderOrFail } from "./orderGuards";

export class RemoveOrderService {
  async execute(order_id: string) {
    // Só rascunhos podem ser apagados: depois de enviado, a cozinha já está preparando
    await findDraftOrderOrFail(order_id);

    // Itens são removidos em cascata (onDelete: Cascade no schema)
    return prisma.order.delete({ where: { id: order_id } });
  }
}
