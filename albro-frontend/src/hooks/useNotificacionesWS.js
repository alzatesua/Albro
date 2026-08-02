// src/hooks/useNotificacionesWS.js
import { useEffect, useRef, useCallback } from "react";
import { getWsTicket } from "@/services/api";

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8006";
const RECONEXION_MS = 3000;

export function useNotificacionesWS({ usuario, onNuevaNotificacion, onCitaActualizada, debeSilenciarSonido }) {
  const socketRef = useRef(null);
  const reconectarTimeoutRef = useRef(null);
  const montadoRef = useRef(true);
  const audioChatRef = useRef(null);
  const audioGeneralRef = useRef(null);

  // Precarga los audios una sola vez
  useEffect(() => {
    audioChatRef.current = new Audio("/sounds/notificacion3.mp3");
    audioChatRef.current.volume = 0.8;

    const rutaGeneral = import.meta.env.VITE_SONIDO_NOTIFICACION || "/sounds/notificacion2.mp3";
    audioGeneralRef.current = new Audio(rutaGeneral);
    audioGeneralRef.current.volume = 0.8;
  }, []);

  const reproducirSonido = useCallback((notificacion) => {
    const esChat = notificacion?.tipo === "mensaje";
    const audio = esChat ? audioChatRef.current : audioGeneralRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Los navegadores bloquean autoplay si el usuario no ha interactuado
      // con la página todavía — es esperable, no es un error real.
    });
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
            onNuevaNotificacion?.(data.notificacion);
            if (!debeSilenciarSonido?.(data.notificacion)) {
              reproducirSonido(data.notificacion);
            }
          } else if (data.tipo && data.cita) {
            onCitaActualizada?.(data);
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
  }, [usuario?.id, onNuevaNotificacion, onCitaActualizada, reproducirSonido, debeSilenciarSonido]);

  useEffect(() => {
    montadoRef.current = true;
    conectar();

    return () => {
      montadoRef.current = false;
      clearTimeout(reconectarTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [conectar]);
}