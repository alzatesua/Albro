import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import Portal from "@/components/ui/Portal";
import { calificarCita } from "@/services/api";

const ModalCalificarProfesional = ({ cita, onClose, onCalificado }) => {
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleEnviar = async () => {
    if (estrellas === 0) {
      setError("Selecciona al menos 1 estrella.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await calificarCita({
        cita_id: cita.cita_id,
        estrellas,
        comentario,
      });
      setExito(true);
      onCalificado?.(cita.cita_id);
      setTimeout(() => onClose(), 1400);
    } catch (err) {
      setError(err.message || "No se pudo enviar tu calificación.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate__animated animate__fadeIn animate__faster">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-sm overflow-hidden animate__animated animate__zoomIn animate__faster">
          {exito ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                ¡Gracias por tu calificación!
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-white">
                  Califica tu servicio
                </span>
              </div>

              {/* Contenido */}
              <div className="px-5 py-5">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  {cita.profesional_nombre
                    ? `¿Cómo te fue con ${cita.profesional_nombre}?`
                    : "¿Cómo estuvo tu servicio?"}
                </p>
                {cita.servicio_nombre && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">{cita.servicio_nombre}</p>
                )}

                {/* Estrellas */}
                <div className="flex items-center justify-center gap-1.5 py-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEstrellas(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={
                          n <= (hover || estrellas)
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-200 dark:text-zinc-700"
                        }
                      />
                    </button>
                  ))}
                </div>

                {/* Comentario opcional 
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentarios (opcional)"
                  rows={3}
                  className="w-full mt-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                />*/}

                {error && (
                  <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={onClose}
                  disabled={enviando}
                  className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-40"
                >
                  Omitir
                </button>
                <button
                  onClick={handleEnviar}
                  disabled={enviando || estrellas === 0}
                  className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enviando && <Loader2 size={14} className="animate-spin" />}
                  {enviando ? "Enviando..." : "Enviar calificación"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
};

export default ModalCalificarProfesional;