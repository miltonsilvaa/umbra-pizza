import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOrigins, env } from "./config/env";
import { UPLOAD_FOLDER } from "./config/multer";
import { initSocket } from "./lib/socket";
import { errorHandler } from "./middlewares/errorHandler";
import { router } from "./routes";

const app = express();

app.use(cors({ origin: corsOrigins }));
app.use(helmet());
app.use(express.json());

// Imagens dos produtos: GET /files/<banner>
// O Helmet marca as respostas como "same-origin" por padrão; o painel (porta 3000)
// carrega essas imagens via <img> de uma origem diferente da API, então liberamos
// Cross-Origin-Resource-Policy só nesta rota estática.
app.use(
  "/files",
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(UPLOAD_FOLDER),
);

app.use(router);

// Express 5 encaminha erros de handlers async direto para cá
app.use(errorHandler);

const server = createServer(app);
initSocket(server);

server.listen(env.PORT, () => {
  console.log(`🍕 API rodando em http://localhost:${env.PORT}`);
});
