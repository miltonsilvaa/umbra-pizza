import path from "node:path";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { AppError } from "../errors/AppError";
import { cloudinary } from "./cloudinary";
import { env } from "./env";

// Mantida só para servir as fotos de produto já salvas em disco antes da
// migração para o Cloudinary (GET /files/:banner, em server.ts). Nenhum
// upload novo grava aqui.
export const UPLOAD_FOLDER = path.resolve(__dirname, "..", "..", "tmp");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    // `multer-storage-cloudinary@4` tenta inferir as chaves aceitas a partir dos tipos do
    // pacote `cloudinary`, mas a versão instalada adicionou um índice [futureKey: string]
    // em UploadApiOptions, o que colapsa esse cálculo e rejeita até campos válidos (ex:
    // "folder"). Os campos abaixo são aceitos em runtime pela API do Cloudinary.
    params: { folder: "pizzaria/products", allowed_formats: ["jpg", "jpeg", "png", "webp"] } as CloudinaryStorage["params"],
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, callback) => {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return callback(new AppError("Upload de imagem indisponível: credenciais do Cloudinary não configuradas."));
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(new AppError("Formato de imagem inválido. Use JPG, PNG ou WEBP."));
    }
    callback(null, true);
  },
});
