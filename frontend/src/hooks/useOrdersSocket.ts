"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/services/api";
import { getToken } from "@/lib/cookies";
import type { Order } from "@/types";

interface Handlers {
  onSent: (order: Order) => void;
  onFinished: (payload: { id: string }) => void;
  onClosed?: (payload: { id: string }) => void;
}

/** Escuta a fila da cozinha em tempo real. Retorna se a conexão está ativa. */
export function useOrdersSocket(handlers: Handlers) {
  const [connected, setConnected] = useState(false);

  // Ref para não reconectar o socket a cada render quando os handlers mudarem
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const socket = io(API_URL, { auth: { token: getToken() } });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("order:sent", (order: Order) => handlersRef.current.onSent(order));
    socket.on("order:finished", (payload: { id: string }) => handlersRef.current.onFinished(payload));
    socket.on("order:closed", (payload: { id: string }) => handlersRef.current.onClosed?.(payload));

    return () => {
      socket.disconnect();
    };
  }, []);

  return connected;
}
