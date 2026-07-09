import { useEffect, useRef, useState } from "react";
import { X, AlertCircle, Check } from "lucide-react";
import Portal from "./ui/Portal";

const DURACION_MS = 10000;
const DURACION_SALIDA_MS = 750; // duración aproximada de bounceOutRight

const Toast = ({ toast, onClose }) => {
  const onCloseRef = useRef(onClose);
  const [saliendo, setSaliendo] = useState(false);
  const [toastVisible, setToastVisible] = useState(toast);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Cuando llega un toast nuevo, lo mostramos sin animación de salida
  useEffect(() => {
    if (toast) {
      setToastVisible(toast);
      setSaliendo(false);
    }
  }, [toast]);

  // Dispara el cierre automático a los 30s
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => {
      setSaliendo(true);
    }, DURACION_MS);
    return () => clearTimeout(timeout);
  }, [toast]);

  // Cuando termina la animación de salida, recién ahí avisamos al padre
  useEffect(() => {
    if (!saliendo) return;
    const timeout = setTimeout(() => {
      onCloseRef.current?.();
      setToastVisible(null);
    }, DURACION_SALIDA_MS);
    return () => clearTimeout(timeout);
  }, [saliendo]);

  const handleCerrarManual = () => {
    setSaliendo(true);
  };

  if (!toastVisible) return null;
  const esError = toastVisible.tipo === "error";

  return (
    <Portal>
      <div
        key={toastVisible.key}
        className={`fixed top-5 right-5 z-[150] animate__animated ${
          saliendo ? "animate__bounceOutRight" : "animate__bounceInRight"
        }`}
        role="status"
        aria-live="polite"
      >
        <div
          className={`relative overflow-hidden min-w-[260px] max-w-sm rounded-xl shadow-lg border backdrop-blur-sm ${
            esError
              ? "bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-500/30"
              : "bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-700"
          }`}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              className={`shrink-0 self-center w-7 h-7 rounded-full flex items-center justify-center ${
                esError
                  ? "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                  : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {esError ? <AlertCircle size={15} /> : <Check size={15} />}
            </span>

            <div className="flex-1 pt-0.5">
              <p
                className={`text-sm font-medium leading-tight ${
                  esError ? "text-red-700 dark:text-red-300" : "text-zinc-800 dark:text-zinc-100"
                }`}
              >
                {esError ? "Ocurrió un error" : "Listo"}
              </p>
              <p
                className={`text-xs mt-0.5 leading-snug ${
                  esError ? "text-red-600/90 dark:text-red-400/80" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {toastVisible.mensaje}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCerrarManual}
              className={`shrink-0 self-center w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                esError
                  ? "text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-label="Cerrar notificación"
            >
              <X size={15} />
            </button>
          </div>

          {/* Barra de progreso */}
          {!saliendo && (
            <div
              key={`progress-${toastVisible.key}`}
              className={`h-1 origin-left animate-toast-progress ${
                esError ? "bg-red-400 dark:bg-red-500" : "bg-emerald-400 dark:bg-emerald-500"
              }`}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .animate-toast-progress {
          animation: toast-progress ${DURACION_MS}ms linear forwards;
        }
      `}</style>
    </Portal>
  );
};

export default Toast;