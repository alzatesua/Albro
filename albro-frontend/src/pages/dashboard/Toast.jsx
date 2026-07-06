import { X, AlertCircle, Check } from "lucide-react";
import Portal from "@/components/ui/Portal";

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const esError = toast.tipo === "error";

  return (
    <Portal>
      <div
        key={toast.key}
        className="fixed top-5 right-5 z-[150] animate-toast-in"
        role="status"
        aria-live="polite"
      >
        <div
          className={`flex items-start gap-3 min-w-[260px] max-w-sm px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
            esError
              ? "bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-500/30"
              : "bg-white/95 dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-700"
          }`}
        >
          <span
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
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
              {toast.mensaje}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              esError
                ? "text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/15"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label="Cerrar notificación"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </Portal>
  );
};

export default Toast;