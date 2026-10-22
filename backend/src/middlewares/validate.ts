import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type Source = "body" | "query" | "params";

/**
 * Valida req[source] com um schema Zod e salva o resultado já convertido
 * em res.locals.data (ex: "3" → 3 em campos numéricos).
 */
export function validate(schema: ZodTypeAny, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals.data = schema.parse(req[source]);
    next();
  };
}
