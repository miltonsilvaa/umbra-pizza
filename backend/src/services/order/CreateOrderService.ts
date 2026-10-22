import { prisma } from "../../lib/prisma";

interface Request {
  table: number;
  name?: string;
}

export class CreateOrderService {
  async execute({ table, name }: Request) {
    return prisma.order.create({
      data: { table, name: name || null },
    });
  }
}
