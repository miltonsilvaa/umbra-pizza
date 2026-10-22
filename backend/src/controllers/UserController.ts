import type { Request, Response } from "express";
import { CreateUserService } from "../services/user/CreateUserService";
import { AuthUserService } from "../services/user/AuthUserService";
import { DetailUserService } from "../services/user/DetailUserService";

export class UserController {
  async create(_req: Request, res: Response) {
    const user = await new CreateUserService().execute(res.locals.data);
    return res.status(201).json(user);
  }

  async auth(_req: Request, res: Response) {
    const session = await new AuthUserService().execute(res.locals.data);
    return res.json(session);
  }

  async me(req: Request, res: Response) {
    const user = await new DetailUserService().execute(req.user_id);
    return res.json(user);
  }
}
