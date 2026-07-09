// src/hooks/useNotificacionesWS.js
import { useEffect, useRef, useCallback } from "react";
import { getWsTicket } from "@/services/api"; // ajusta el path real

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8006";
const RECONEXION_MS = 3000;

export function useNotificacionesWS({ usuario, onNuevaNotificacion }) {
  const socketRef = useRef(null);
  const reconectarTimeoutRef = useRef(null);
  const montadoRef = useRef(true);
  const audioRef = useRef(null);

  // Precarga el audio una sola vez
  useEffect(() => {
    const rutaSonido = import.meta.env.VITE_SONIDO_NOTIFICACION || "/sounds/notificacion2.mp3";
    audioRef.current = new Audio(rutaSonido);
    audioRef.current.volume = 0.8;
  }, []); //

  const reproducirSonido = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Los navegadores bloquean autoplay si el usuario no ha interactuado
        // con la página todavía — es esperable, no es un error real.
      });
    }
  }, []);

  const conectar = useCallback(async () => {
    if (!usuario?.id) return;

    try {
      const { ticket } = await getWsTicket();
      if (!montadoRef.current) return;

      const socket = new WebSocket(`${WS_BASE_URL}/ws/citas/?ticket=${ticket}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.evento === "notificacion" && data.notificacion) {
            onNuevaNotificacion(data.notificacion);
            reproducirSonido();
          }
        } catch (err) {
          console.error("Error parseando mensaje WS:", err);
        }
      };

      socket.onclose = () => {
        socketRef.current = null;
        if (montadoRef.current) {
          reconectarTimeoutRef.current = setTimeout(conectar, RECONEXION_MS);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (err) {
      console.error("Error obteniendo ticket WS:", err);
      if (montadoRef.current) {
        reconectarTimeoutRef.current = setTimeout(conectar, RECONEXION_MS);
      }
    }
  }, [usuario?.id, onNuevaNotificacion, reproducirSonido]);

  useEffect(() => {
    montadoRef.current = true;
    conectar();

    return () => {
      montadoRef.current = false;
      clearTimeout(reconectarTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null; // evita reconectar al desmontar
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [conectar]);
}