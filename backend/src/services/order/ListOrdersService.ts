import { prisma } from "../../lib/prisma";

export class ListOrdersService {
  /** Fila da cozinha: pedidos enviados e ainda não concluídos, na ordem em que chegaram. */
  async execute() {
    return prisma.order.findMany({
      where: { draft: false, status: false },
      // Na fila, updated_at = momento do envio (itens não alteram o pedido e
      // a próxima atualização é a conclusão, que o tira da fila)
      orderBy: { updated_at: "asc" },
      include: { _count: { select: { items: true } } },
    });
  }
}
