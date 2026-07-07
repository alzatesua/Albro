import { X, Clock, Calendar, User } from "lucide-react";

const formatHora = (horaStr) => {
  if (!horaStr) return "";
  const [h, m] = horaStr.split(":");
  const hora = parseInt(h, 10);
  const periodo = hora >= 12 ? "PM" : "AM";
  const hora12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${String(hora12).padStart(2, "0")}:${m} ${periodo}`;
};

const CitaAlertaModal = ({ cita, onConfirmar, onCancelar, onCerrar, procesando }) => {
  if (!cita) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 p-5 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Nueva cita pendiente
          </h3>
          <button onClick={onCerrar} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-5">
          <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <User className="w-4 h-4 text-zinc-400" />
            {cita.usuario_nombre}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{cita.servicio_nombre}</p>
          <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <Calendar className="w-4 h-4 text-zinc-400" />
            {cita.fecha}
          </p>
          <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-400" />
            {formatHora(cita.hora_inicio)} - {formatHora(cita.hora_fin)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onCancelar(cita.id)}
            disabled={procesando}
            className="flex-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-2 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(cita.id)}
            disabled={procesando}
            className="flex-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitaAlertaModal;