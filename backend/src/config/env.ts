import "dotenv/config";
import { z } from "zod";

function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("30d"),
  PORT: z.coerce.number().default(3333),
  CORS_ORIGIN: z.string().default("*"),
  // Opcionais: sem elas a API sobe normalmente, só o upload de produto falha
  // com uma mensagem clara em vez de travar o boot inteiro. "" no .env conta
  // como "ausente" (facilita deixar o placeholder em branco até ter a conta).
  CLOUDINARY_CLOUD_NAME: emptyToUndefined(z.string().min(1)),
  CLOUDINARY_API_KEY: emptyToUndefined(z.string().min(1)),
  CLOUDINARY_API_SECRET: emptyToUndefined(z.string().min(1)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins =
  env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((o) => o.trim());
