import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import { AppError } from "../errors/AppError";

export const UPLOAD_FOLDER = path.resolve(__dirname, "..", "..", "tmp");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_FOLDER,
    filename: (_req, file, callback) => {
      const hash = crypto.randomBytes(16).toString("hex");
      const ext = path.extname(file.originalname).toLowerCase();
      callback(null, `${hash}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(new AppError("Formato de imagem inválido. Use JPG, PNG ou WEBP."));
    }
    callback(null, true);
  },
});
