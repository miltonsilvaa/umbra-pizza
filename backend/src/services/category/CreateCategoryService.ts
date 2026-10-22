import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

export class CreateCategoryService {
  async execute(name: string) {
    const alreadyExists = await prisma.category.findUnique({ where: { name } });

    if (alreadyExists) {
      throw new AppError("Categoria já cadastrada", 409);
    }

    return prisma.category.create({
      data: { name },
      select: { id: true, name: true },
    });
  }
}
