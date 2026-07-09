import { useState, useEffect } from "react";
import { X, CalendarClock } from "lucide-react";

const ReagendarModal = ({ cita, onReagendar, onCerrar, procesando }) => {
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [error, setError] = useState(null);

  // Precarga los valores actuales de la cita cada vez que se abre el modal
  useEffect(() => {
    if (cita) {
      setFecha(cita.fecha || "");
      setHoraInicio(cita.hora_inicio?.slice(0, 5) || "");
      setHoraFin(cita.hora_fin?.slice(0, 5) || "");
      setError(null);
    }
  }, [cita]);

  if (!cita) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fecha || !horaInicio || !horaFin) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (horaFin <= horaInicio) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    try {
      await onReagendar(cita.id, {
        fecha,
        hora_inicio: `${horaInicio}:00`,
        hora_fin: `${horaFin}:00`,
      });
    } catch (err) {
      setError(err.message || "No se pudo reagendar la cita.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarClock className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Reagendar cita
            </h3>
          </div>
          <button
            onClick={onCerrar}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cita.usuario_nombre && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Cita con <span className="font-medium">{cita.usuario_nombre}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Hora inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Hora fin
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
          </div>


          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
            type="submit"
            disabled={procesando}
            className="flex-1 rounded-md bg-white text-black border border-black px-3 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
            {procesando ? "Reagendando..." : "Reagendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReagendarModal;