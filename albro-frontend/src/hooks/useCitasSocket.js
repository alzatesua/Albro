import { useEffect, useRef, useCallback } from "react";
import { getWsTicket } from "../services/api"; // ajusta la ruta si tu api.js está en otro lado

// http://localhost:8006/api -> ws://localhost:8006/ws/citas/
const getWsBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8006/api";
  const sinApi = apiUrl.replace(/\/api\/?$/, "");
  return sinApi.replace(/^http/, "ws") + "/ws/citas/";
};

export const useCitasSocket = (onMensaje) => {
  const socketRef = useRef(null);
  const reintentoRef = useRef(null);
  const onMensajeRef = useRef(onMensaje);
  onMensajeRef.current = onMensaje;

  const conectar = useCallback(async () => {
    try {
      const { ticket } = await getWsTicket();
      const socket = new WebSocket(`${getWsBaseUrl()}?ticket=${ticket}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMensajeRef.current?.(data.tipo, data.cita);
        } catch {
          console.error("Mensaje de websocket inválido:", event.data);
        }
      };

      // El ticket expira rápido y la conexión se puede caer; reconectamos
      // pidiendo un ticket nuevo cada vez.
      socket.onclose = () => {
        reintentoRef.current = setTimeout(conectar, 3000);
      };

      socket.onerror = () => socket.close();
    } catch (err) {
      console.error("No se pudo obtener el ticket de websocket:", err);
      reintentoRef.current = setTimeout(conectar, 5000);
    }
  }, []);

  useEffect(() => {
    conectar();
    return () => {
      clearTimeout(reintentoRef.current);
      socketRef.current?.close();
    };
  }, [conectar]);
};