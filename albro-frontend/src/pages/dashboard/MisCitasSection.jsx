import { useState, useEffect, useCallback } from "react";import { getCitas, cancelarCita as cancelarCitaApi } from "../../services/api";
import { CalendarClock, MapPin, XCircle, MessageCircle } from "lucide-react";
import ChatModal from "../../components/chat/ChatModal";

const colorEstado = (estado) => {
  switch (estado) {
    case "confirmada": return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "pendiente":  return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "cancelada":  return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
    case "completada": return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    default:           return "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
  }
};


const formatearFecha = (isoString) =>
  new Date(isoString).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });

const MisCitasSection = () => {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [chatCita, setChatCita] = useState(null);
  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getCitas();
      setCitas(data.results ?? data);
    } catch (err) {
      console.error("Error cargando mis citas:", err);
      setError("No se pudieron cargar tus citas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const cancelarCita = async (id) => {
    if (!window.confirm("¿Seguro que quieres cancelar esta cita?")) return;
    try {
      await cancelarCitaApi(id);
      setCitas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estado: "cancelada" } : c))
      );
    } catch (err) {
      console.error("Error cancelando cita:", err);
    }
  };

  if (cargando) {
    return (
      <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
        Cargando tus citas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-red-500">{error}</div>
    );
  }

  if (citas.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
        Aún no tienes citas agendadas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
        Mis citas
      </h2>

      {citas.map((cita) => (
        <div
          key={cita.id}
          className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 flex items-start justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-zinc-900 dark:text-white truncate">
                {cita.servicio_nombre}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorEstado(cita.estado)}`}
              >
                {cita.estado}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <CalendarClock size={14} />
              <span>{formatearFecha(cita.fecha)}</span>
            </div>

            {cita.profesional_nombre && (
              <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                <MapPin size={14} />
                <span>{cita.profesional_nombre}</span>
              </div>
            )}
          </div>
          

          {(cita.estado === "pendiente" || cita.estado === "confirmada") && (
            <button
              onClick={() => cancelarCita(cita.id)}
              className="shrink-0 text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <XCircle size={14} />
              Cancelar
            </button>
          )}
           <div className="flex items-center gap-2 shrink-0">
            {cita.profesional && (
              <button
                onClick={() => setChatCita(cita)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
              >
                <MessageCircle size={14} />
                Mensaje
              </button>
            )}

            {(cita.estado === "pendiente" || cita.estado === "confirmada") && (
              <button
                onClick={() => cancelarCita(cita.id)}
                className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <XCircle size={14} />
                Cancelar
              </button>
            )}
          </div>
        </div>
      ))}
      <ChatModal
        abierto={!!chatCita}
        onClose={() => setChatCita(null)}
        profesionalId={chatCita?.profesional}
        nombreContacto={chatCita?.profesional_nombre}
      />
    </div>
  );
};

export default MisCitasSection;