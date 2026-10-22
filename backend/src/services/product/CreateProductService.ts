import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";

interface Request {
  name: string;
  price: number;
  description: string;
  /** URL completa da imagem no Cloudinary (produtos antigos guardam só o nome do arquivo local). */
  banner: string;
  category_id: string;
}

export class CreateProductService {
  async execute({ name, price, description, banner, category_id }: Request) {
    const category = await prisma.category.findUnique({ where: { id: category_id } });

    if (!category) {
      throw new AppError("Categoria não encontrada", 404);
    }

    return prisma.product.create({
      data: { name, price, description, banner, category_id },
    });
  }
}
