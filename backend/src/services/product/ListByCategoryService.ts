import { prisma } from "../../lib/prisma";

export class ListByCategoryService {
  async execute(category_id: string) {
    return prisma.product.findMany({
      where: { category_id },
      orderBy: { name: "asc" },
    });
  }
}
