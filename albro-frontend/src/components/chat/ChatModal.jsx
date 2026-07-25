import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import "animate.css";
import {
  obtenerOCrearConversacion,
  getMensajesConversacion,
  getWsTicket,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8006";
const SONIDO_NOTIFICACION_URL = "/sounds/notificacion3.mp3";
const MENSAJES_POR_PAGINA = 20;
const UMBRAL_SCROLL_TOP = 80; // px desde arriba para disparar "cargar más"

// Extrae el valor del query param "cursor" de una URL "next"/"previous" completa
const extraerCursor = (url) => {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("cursor");
  } catch {
    return null;
  }
};

const ChatModal = ({ abierto, onClose, clienteId, profesionalId, conversacionId: conversacionIdProp, nombreContacto }) => {
  const { usuario } = useAuth();
  const [conversacionId, setConversacionId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [hayMasAntiguos, setHayMasAntiguos] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoMensajeNuevoId, setUltimoMensajeNuevoId] = useState(null);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const usuarioIdRef = useRef(null);
  const audioRef = useRef(null);
  const esCargaInicialRef = useRef(true);
  const cursorSiguienteRef = useRef(null); // cursor para pedir mensajes más antiguos
  const ajusteScrollPendienteRef = useRef(null); // { prevScrollHeight, prevScrollTop }

  // ── Precarga el audio de notificación una sola vez ────────────────────
  useEffect(() => {
    audioRef.current = new Audio(SONIDO_NOTIFICACION_URL);
    audioRef.current.preload = "auto";
  }, []);

  const reproducirSonido = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const cerrarSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setConectado(false);
  }, []);

  // ── Conexión completa: conversación -> historial -> ticket -> WS ─────
  useEffect(() => {
    if (!abierto) return;

    let cancelado = false;
    setCargando(true);
    setError(null);
    setMensajes([]);
    setUltimoMensajeNuevoId(null);
    setHayMasAntiguos(false);
    esCargaInicialRef.current = true;
    cursorSiguienteRef.current = null;

    const iniciar = async () => {
      try {
        let conversacion;
        if (conversacionIdProp) {
          conversacion = { id: conversacionIdProp };
        } else {
          const payload = clienteId ? { cliente_id: clienteId } : { profesional_id: profesionalId };
          conversacion = await obtenerOCrearConversacion(payload);
        }
        if (cancelado) return;
        setConversacionId(conversacion.id);
        usuarioIdRef.current = usuario.id;

        // 2. Primera página = los 20 más recientes (vienen del más nuevo al más viejo)
        const historial = await getMensajesConversacion(conversacion.id, {
          page_size: MENSAJES_POR_PAGINA,
        });
        if (cancelado) return;

        setMensajes([...historial.results].reverse()); // orden ascendente para mostrar
        cursorSiguienteRef.current = extraerCursor(historial.next);
        setHayMasAntiguos(Boolean(historial.next));

        // 3. Ticket + WS
        const { ticket } = await getWsTicket();
        if (cancelado) return;

        const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${conversacion.id}/?ticket=${ticket}`);
        socketRef.current = ws;

        ws.onopen = () => setConectado(true);

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.evento === "mensaje") {
            const mensaje = data.mensaje;
            setMensajes((prev) => [...prev, mensaje]);
            setUltimoMensajeNuevoId(mensaje.id);

            const esMio = Number(mensaje.remitente) === Number(usuarioIdRef.current);
            if (!esMio) reproducirSonido();
          }
        };

        ws.onclose = (event) => {
          setConectado(false);
          if (!cancelado && event.code !== 1000) {
            setError("Se perdió la conexión del chat. Cierra y vuelve a abrir.");
          }
        };

        ws.onerror = () => setError("Error de conexión con el chat.");
      } catch (err) {
        if (!cancelado) setError(err.message || "No se pudo iniciar el chat.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    iniciar();

    return () => {
      cancelado = true;
      cerrarSocket();
    };
  }, [abierto, clienteId, profesionalId, cerrarSocket, reproducirSonido]);

  // ── Cargar mensajes más antiguos (scroll hacia arriba) ────────────────
  const cargarMasAntiguos = useCallback(async () => {
    if (!conversacionId || !cursorSiguienteRef.current || cargandoMas) return;

    const el = scrollRef.current;
    setCargandoMas(true);

    // Guardamos la posición actual para restaurarla después de prependear
    if (el) {
      ajusteScrollPendienteRef.current = {
        prevScrollHeight: el.scrollHeight,
        prevScrollTop: el.scrollTop,
      };
    }

    try {
      const data = await getMensajesConversacion(conversacionId, {
        cursor: cursorSiguienteRef.current,
        page_size: MENSAJES_POR_PAGINA,
      });

      setMensajes((prev) => [...[...data.results].reverse(), ...prev]);
      cursorSiguienteRef.current = extraerCursor(data.next);
      setHayMasAntiguos(Boolean(data.next));
    } catch (err) {
      console.error("Error cargando mensajes antiguos:", err);
      ajusteScrollPendienteRef.current = null; // no había nada que ajustar
    } finally {
      setCargandoMas(false);
    }
  }, [conversacionId, cargandoMas]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || cargando) return;
    if (el.scrollTop < UMBRAL_SCROLL_TOP && hayMasAntiguos && !cargandoMas) {
      cargarMasAntiguos();
    }
  };

  // ── Auto-scroll ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || cargando || mensajes.length === 0) return;

    // Caso 1: acabamos de prependear mensajes antiguos -> restaurar posición
    if (ajusteScrollPendienteRef.current) {
      const { prevScrollHeight, prevScrollTop } = ajusteScrollPendienteRef.current;
      el.style.scrollBehavior = "auto";
      el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
      ajusteScrollPendienteRef.current = null;
      return;
    }

    // Caso 2: carga inicial -> saltar al final sin animación
    if (esCargaInicialRef.current) {
      el.style.scrollBehavior = "auto";
      el.scrollTop = el.scrollHeight;
      esCargaInicialRef.current = false;
      return;
    }

    // Caso 3: mensaje nuevo por WS -> scroll suave
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensajes, cargando]);

  const enviarMensaje = () => {
    const contenido = texto.trim();
    if (!contenido || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ contenido }));
    setTexto("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const handleClose = () => {
    cerrarSocket();
    onClose();
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md h-[600px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {nombreContacto || "Chat"}
            </h3>
            <span className={`text-[11px] ${conectado ? "text-emerald-500" : "text-zinc-400"}`}>
              {conectado ? "En línea" : "Conectando…"}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensajes */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 [scroll-behavior:auto]"
        >
          {cargando ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={22} className="animate-spin text-zinc-400" />
            </div>
          ) : error ? (
            <div className="text-center text-sm text-red-500 mt-10">{error}</div>
          ) : mensajes.length === 0 ? (
            <div className="text-center text-sm text-zinc-400 mt-10">
              Aún no hay mensajes. Envía el primero.
            </div>
          ) : (
            <>
              {cargandoMas && (
                <div className="flex justify-center py-2">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                </div>
              )}
              {mensajes.map((m) => {
                const esMio = Number(m.remitente) === Number(usuarioIdRef.current);
                const esNuevo = m.id === ultimoMensajeNuevoId;
                return (
                  <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                    <div
                      onAnimationEnd={() => {
                        if (esNuevo) setUltimoMensajeNuevoId(null);
                      }}
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                        esNuevo ? "animate__animated animate__rubberBand" : ""
                      } ${
                        esMio
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-sm"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm"
                      }`}
                    >
                      {m.contenido}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-3 py-2.5 flex items-center gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe un mensaje…"
            disabled={!conectado}
            className="flex-1 resize-none bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={enviarMensaje}
            disabled={!conectado || !texto.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-30 transition-opacity shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;