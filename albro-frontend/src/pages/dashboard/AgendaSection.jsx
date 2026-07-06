import { useState, useEffect } from "react";
import { Calendar, Clock, User, ChevronLeft, ChevronRight} from "lucide-react";
import { getCitas, confirmarCita } from "../../services/api"; // ajusta la ruta según tu estructura

// Duración de la caída de cada tarjeta al cambiar de dígito
const FLIP_MS = 320;
const CITAS_POR_PAGINA = 5;

// Tarjeta de un solo dígito: al cambiar el valor, la tarjeta superior cae
// girando y deja ver el nuevo número debajo.
const DigitCard = ({ digit }) => {
  const [shown, setShown] = useState(digit);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit !== shown) {
      setFlipping(true);
      const timeout = setTimeout(() => {
        setShown(digit);
        setFlipping(false);
      }, FLIP_MS);
      return () => clearTimeout(timeout);
    }
  }, [digit, shown]);

  return (
    <div
      className="relative h-16 w-10 sm:h-15 sm:w-14 [perspective:400px]"
      style={{ perspective: "400px" }}
    >
      <div className="absolute inset-0 flex h-full w-full items-center justify-center rounded-md border border-black/5 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 font-mono font-bold tabular-nums leading-none text-3xl sm:text-4xl text-zinc-700 dark:text-zinc-200">
        <span className="translate-y-[2px] sm:translate-y-[3px]">{digit}</span>
      </div>

      {flipping && (
        <div
          className="absolute inset-0 flex h-full w-full items-center justify-center rounded-md border border-black/5 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 font-mono font-bold tabular-nums leading-none text-3xl sm:text-4xl text-zinc-700 dark:text-zinc-200 animate-flip-fall"
          style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
        >
          <span className="translate-y-[2px] sm:translate-y-[3px]">{shown}</span>
        </div>
      )}
    </div>
  );
};
// Cronómetro regresivo: cuenta desde la duración de una cita (mm:ss)
const Cronometro = ({ segundosIniciales, onTerminar, onCancelar }) => {
  const [segundosRestantes, setSegundosRestantes] = useState(segundosIniciales);

  useEffect(() => {
    setSegundosRestantes(segundosIniciales);
  }, [segundosIniciales]);

  useEffect(() => {
    if (segundosRestantes <= 0) {
      onTerminar?.();
      return;
    }
    const timeout = setTimeout(() => {
      setSegundosRestantes((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [segundosRestantes, onTerminar]);

  // Soporta hasta 99 minutos; si la cita dura más, se muestra en horas:minutos
  const usaHoras = segundosRestantes >= 60 * 100;
  const unidadUno = usaHoras
    ? Math.floor(segundosRestantes / 3600)
    : Math.floor(segundosRestantes / 60);
  const unidadDos = usaHoras
    ? Math.floor((segundosRestantes % 3600) / 60)
    : segundosRestantes % 60;

  const g1 = String(unidadUno).padStart(2, "0");
  const g2 = String(unidadDos).padStart(2, "0");

  const Group = ({ value }) => (
    <div className="flex gap-1">
      <DigitCard digit={value[0]} />
      <DigitCard digit={value[1]} />
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full py-2">
      <p className="mb-4 text-sm text-zinc-400 dark:text-zinc-500">
        Tiempo restante {usaHoras ? "(h:min)" : "(min:seg)"}
      </p>

      <div className="flex items-center gap-2">
        <Group value={g1} />
        <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">:</span>
        <Group value={g2} />
      </div>

      <button
        onClick={onCancelar}
        className="mt-4 flex items-center gap-1.5 rounded-md bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 px-3 py-1.5 text-xs font-medium hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        Cancelar cronómetro
      </button>
    </div>
  );
};
// Reloj de tarjetas (flip clock) en vivo
const FlipClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hora24 = now.getHours();
  const periodo = hora24 >= 12 ? "PM" : "AM";
  const hora12 = hora24 % 12 === 0 ? 12 : hora24 % 12;

  const hours = String(hora12).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const formattedDate = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const Group = ({ value }) => (
    <div className="flex gap-1">
      <DigitCard digit={value[0]} />
      <DigitCard digit={value[1]} />
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full py-2">
     <div className="flex items-center gap-2">
      <Group value={hours} />
      <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">:</span>
      <Group value={minutes} />
      <span className="ml-1 text-lg font-semibold text-zinc-400 dark:text-zinc-500 self-end translate-y-[8px] sm:translate-y-[6px]">
        {periodo}
      </span>
    </div>

      {/*<p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500 capitalize">
        {formattedDate}
      </p>*/}
    </div>
  );
};

// ─── Helpers de formato ─────────────────────────────────────────────────────

// "09:00:00" -> "09:00 AM"
const formatHora = (horaStr) => {
  if (!horaStr) return "";
  const [h, m] = horaStr.split(":");
  const hora = parseInt(h, 10);
  const periodo = hora >= 12 ? "PM" : "AM";
  const hora12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${String(hora12).padStart(2, "0")}:${m} ${periodo}`;
};

// "2024-10-05" -> "Hoy" | "Mañana" | "5 oct"
const formatFecha = (fechaStr) => {
  if (!fechaStr) return "";

  const fecha = new Date(`${fechaStr}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  if (fecha.getTime() === hoy.getTime()) return "Hoy";
  if (fecha.getTime() === manana.getTime()) return "Mañana";

  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

// ¿La cita ya pasó su fecha/hora de inicio?
const esVencida = (cita) => {
  const fechaHora = new Date(`${cita.fecha}T${cita.hora_inicio}`);
  return fechaHora < new Date();
};

// Duración de la cita en segundos, a partir de hora_inicio y hora_fin
const calcularDuracionSegundos = (cita) => {
  const inicio = new Date(`2000-01-01T${cita.hora_inicio}`);
  const fin = new Date(`2000-01-01T${cita.hora_fin}`);
  return Math.max(0, Math.round((fin - inicio) / 1000));
};

const AgendaSection = () => {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [confirmando, setConfirmando] = useState(null); // id de la cita en proceso
  const [duracionCronometro, setDuracionCronometro] = useState(null); // segundos, o null si no hay cronómetro activo
  const [arrastrandoSobreReloj, setArrastrandoSobreReloj] = useState(false);
    
  const handleConfirmar = async (citaId) => {
    try {
      setConfirmando(citaId);
      const citaActualizada = await confirmarCita(citaId);

      // Si ya no está pendiente, la quitamos de la lista (optimistic update)
      setCitas((prev) =>
        prev
          .map((c) => (c.id === citaId ? citaActualizada : c))
          .filter((c) => c.estado === "pendiente")
      );
    } catch (err) {
      setError(err.message || "No se pudo confirmar la cita.");
    } finally {
      setConfirmando(null);
    }
  };

  useEffect(() => {
    const cargarCitas = async () => {
      try {
        setCargando(true);
        const data = await getCitas();

        const ahora = new Date();

        const pendientes = data
          .filter((c) => c.estado === "pendiente")
          .sort((a, b) => {
            const fechaHoraA = new Date(`${a.fecha}T${a.hora_inicio}`);
            const fechaHoraB = new Date(`${b.fecha}T${b.hora_inicio}`);

            const aVencida = fechaHoraA < ahora;
            const bVencida = fechaHoraB < ahora;

            // Las próximas (futuras) siempre van antes que las vencidas
            if (aVencida !== bVencida) return aVencida ? 1 : -1;

            // Dentro del mismo grupo: la más cercana a "ahora" primero
            return fechaHoraA - fechaHoraB;
          });

        setCitas(pendientes);
      } catch (err) {
        setError(err.message || "Error al cargar las citas.");
      } finally {
        setCargando(false);
      }
    };

    cargarCitas();
  }, []);

  const totalPaginas = Math.ceil(citas.length / CITAS_POR_PAGINA) || 1;

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [totalPaginas, pagina]);

  const inicio = (pagina - 1) * CITAS_POR_PAGINA;
  const citasPagina = citas.slice(inicio, inicio + CITAS_POR_PAGINA);

  return (
    <div className="w-full">
      <style>{`
        @keyframes flip-fall {
          0% { transform: rotateX(0deg); opacity: 1; }
          60% { transform: rotateX(-100deg); opacity: 0.7; }
          100% { transform: rotateX(-170deg); opacity: 0; }
        }
        .animate-flip-fall {
          animation: flip-fall ${FLIP_MS}ms cubic-bezier(0.5, 0, 0.75, 0) forwards;
        }
      `}</style>

      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">Mis citas</h2>

        </div>
      </div>

      <div className="rounded-xl  bg-white dark:bg-zinc-900 grid grid-cols-1 md:grid-cols-[1.4fr_1fr]   ">
        {/* Columna izquierda: lista de citas pendientes */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Citas pendientes
              </h3>
            </div>
            {citas.length > 0 && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Total {citas.length}
              </span>
            )}
          </div>

          {cargando ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">
              Cargando citas...
            </p>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-8">{error}</p>
          ) : citas.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">
              No tienes citas pendientes.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {citasPagina.map((cita) => (
                  <li
                    key={cita.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(cita.id));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/*<div className="w-8 h-8 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-zinc-500" />
                      </div>*/}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                            {cita.usuario_nombre}
                          </p>
                          {esVencida(cita) && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                              Vencida
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                          {cita.servicio_nombre}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {formatHora(cita.hora_inicio)}
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {formatFecha(cita.fecha)}
                        </p>
                      </div>

                      {cita.estado === "pendiente" && (
                        <button
                          onClick={() => handleConfirmar(cita.id)}
                          disabled={confirmando === cita.id}
                          className="flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1.5 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >

                          {confirmando === cita.id ? "..." : "Confirmar"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Controles de paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </button>

                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Página {pagina} de {totalPaginas}
                  </span>

                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    Siguiente
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Columna derecha: reloj de tarjetas (flip clock) en vivo */} 
        <div
          className={`p-4 transition-colors ${
            arrastrandoSobreReloj ? "bg-emerald-500/5" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrandoSobreReloj(true);
          }}
          onDragLeave={() => setArrastrandoSobreReloj(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrandoSobreReloj(false);
            const citaId = e.dataTransfer.getData("text/plain");
            const cita = citas.find((c) => String(c.id) === citaId);
            if (cita) {
              setDuracionCronometro(calcularDuracionSegundos(cita));
            }
          }}
        >
          {duracionCronometro !== null ? (
            <Cronometro
              segundosIniciales={duracionCronometro}
              onTerminar={() => setDuracionCronometro(null)}
              onCancelar={() => setDuracionCronometro(null)}
            />
          ) : (
            <FlipClock />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgendaSection;