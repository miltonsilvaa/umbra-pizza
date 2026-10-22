import { prisma } from "../../lib/prisma";

export class ListCategoryService {
  async execute() {
    return prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}
