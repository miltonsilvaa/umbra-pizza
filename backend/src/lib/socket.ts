import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verify } from "jsonwebtoken";
import { corsOrigins, env } from "../config/env";

/**
 * Eventos emitidos para os painéis (cozinha e caixa):
 * - "order:sent"     → um pedido saiu do rascunho e entrou na fila da cozinha
 * - "order:finished" → a cozinha concluiu e o pedido aguarda pagamento
 * - "order:closed"   → a conta foi fechada/paga e a mesa deve sair do caixa
 */
export type OrderEvent = "order:sent" | "order:finished" | "order:closed";

let io: Server | null = null;

export function initSocket(server: HttpServer) {
  io = new Server(server, { cors: { origin: corsOrigins } });

  // Só painéis logados escutam a fila: o cliente envia { auth: { token } } no handshake
  io.use((socket, next) => {
    try {
      verify(String(socket.handshake.auth?.token ?? ""), env.JWT_SECRET);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Painel conectado: ${socket.id}`);
  });

  return io;
}

export function emitOrderEvent(event: OrderEvent, payload: unknown) {
  io?.emit(event, payload);
}
