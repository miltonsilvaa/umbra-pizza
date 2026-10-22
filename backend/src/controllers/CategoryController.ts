import type { Request, Response } from "express";
import { CreateCategoryService } from "../services/category/CreateCategoryService";
import { ListCategoryService } from "../services/category/ListCategoryService";

export class CategoryController {
  async create(_req: Request, res: Response) {
    const category = await new CreateCategoryService().execute(res.locals.data.name);
    return res.status(201).json(category);
  }

  async list(_req: Request, res: Response) {
    const categories = await new ListCategoryService().execute();
    return res.json(categories);
  }
}
