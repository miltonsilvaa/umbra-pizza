import type { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

interface Payload {
  sub: string;
}

export function isAuthenticated(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token não informado", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const { sub } = verify(token, env.JWT_SECRET) as Payload;
    req.user_id = sub;
    return next();
  } catch {
    throw new AppError("Token inválido ou expirado", 401);
  }
}
