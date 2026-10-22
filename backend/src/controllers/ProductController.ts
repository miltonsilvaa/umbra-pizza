import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { CreateProductService } from "../services/product/CreateProductService";
import { ListByCategoryService } from "../services/product/ListByCategoryService";

export class ProductController {
  async create(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError("Envie a imagem do produto no campo 'file'");
    }

    const product = await new CreateProductService().execute({
      ...res.locals.data,
      banner: req.file.filename,
    });

    return res.status(201).json(product);
  }

  async listByCategory(_req: Request, res: Response) {
    const products = await new ListByCategoryService().execute(res.locals.data.category_id);
    return res.json(products);
  }
}
