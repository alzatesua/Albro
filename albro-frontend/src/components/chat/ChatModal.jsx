import { useEffect, useRef, useState, useCallback } from "react";
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

const ChatModal = ({ abierto, onClose, clienteId, profesionalId, conversacionId: conversacionIdProp, nombreContacto }) => {
  const { usuario } = useAuth();
  const [conversacionId, setConversacionId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState(null);
  const [ultimoMensajeNuevoId, setUltimoMensajeNuevoId] = useState(null);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const usuarioIdRef = useRef(null); // para distinguir "mío" vs "del otro"
  const audioRef = useRef(null);

  // ── Precarga el audio de notificación una sola vez ────────────────────
  useEffect(() => {
    audioRef.current = new Audio(SONIDO_NOTIFICACION_URL);
    audioRef.current.preload = "auto";
  }, []);

  const reproducirSonido = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // El navegador puede bloquear el autoplay hasta que haya interacción del usuario; se ignora.
    });
  }, []);

  // ── Cierra el socket al desmontar o cerrar el modal ──────────────────
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

        // 2. Cargar historial (última página = más recientes primero, los invertimos)
        const historial = await getMensajesConversacion(conversacion.id, { page_size: 30 });
        if (cancelado) return;
        setMensajes([...historial.results].reverse());

        // 3. Pedir ticket (dura 15s, conectar ya mismo)
        const { ticket } = await getWsTicket();
        if (cancelado) return;

        // 4. Conectar WebSocket
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
            if (!esMio) {
              reproducirSonido();
            }
          }
        };

        ws.onclose = (event) => {
          setConectado(false);
          if (!cancelado && event.code !== 1000) {
            setError("Se perdió la conexión del chat. Cierra y vuelve a abrir.");
          }
        };

        ws.onerror = () => {
          setError("Error de conexión con el chat.");
        };
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

  // ── Auto-scroll al último mensaje ─────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes]);

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
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
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
            mensajes.map((m) => {
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
            })
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