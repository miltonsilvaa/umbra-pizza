import fs from "node:fs";
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Se a requisição falhou depois do upload (ex: validação), descarta a imagem órfã
  if (req.file) {
    fs.promises.unlink(req.file.path).catch(() => {});
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos",
      issues: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Imagem maior que 5MB" : err.message;
    return res.status(400).json({ error: message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: registro não encontrado | P2003: chave estrangeira inválida
    if (err.code === "P2025") return res.status(404).json({ error: "Registro não encontrado" });
    if (err.code === "P2003") return res.status(400).json({ error: "Referência inválida" });
  }

  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
}
