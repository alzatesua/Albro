import { useState, useEffect, useRef   } from "react";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCheck, Play,XCircle, CalendarClock} from "lucide-react";
import { getCitas, confirmarCita, cancelarCita, completarCita, reagendarCita} from "../../services/api"; // ajusta la ruta según tu estructura
import { useCitasSocket } from "../../hooks/useCitasSocket";
import CitaAlertaModal from "../../components/CitaAlertaModal"; // ajusta la ruta
import { useHoraServidor } from "../../hooks/useHoraServidor";
import ReagendarModal from "../../components/ReagendarModal";
import Toast from "../../components/Toast"; // ajusta la ruta según tu estructura


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
      className="relative h-11 w-8 sm:h-12 sm:w-9 [perspective:400px]"
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

const RelojShell = ({ top, digits, bottom }) => (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="h-[18px] w-full flex justify-end items-center">
        {top}
      </div>

      <div className="flex items-center gap-1.5">
        {digits}
      </div>

      <div className="h-[18px] flex items-center">
        {bottom}
      </div>
    </div>
  );
// Cronómetro regresivo: cuenta desde la duración de una cita (mm:ss)
const Cronometro = ({ segundosIniciales, servicio, onTerminar, onCancelar }) => {
  const [segundosRestantes, setSegundosRestantes] = useState(segundosIniciales);
  const onTerminarRef = useRef(onTerminar);

  useEffect(() => {
    onTerminarRef.current = onTerminar;
  }, [onTerminar]);

  useEffect(() => {
    setSegundosRestantes(segundosIniciales);
  }, [segundosIniciales]);

  useEffect(() => {
    if (segundosRestantes <= 0) {
      onTerminarRef.current?.();
      return;
    }
    const timeout = setTimeout(() => {
      setSegundosRestantes((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [segundosRestantes]);

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
    <RelojShell
      top={
        <button
          onClick={onCancelar}
          className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Cancelar
        </button>
      }
      digits={
        <>
          <Group value={g1} />
          <span className="text-lg font-bold text-zinc-300 dark:text-zinc-600">:</span>
          <Group value={g2} />
        </>
      }
      bottom={
        servicio && (
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {servicio}
          </p>
        )
      }
    />
  );
};

const FlipClock = () => {
  const now = useHoraServidor();

  const hora24 = now.getHours();
  const periodo = hora24 >= 12 ? "PM" : "AM";
  const hora12 = hora24 % 12 === 0 ? 12 : hora24 % 12;

  const hours = String(hora12).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const Group = ({ value }) => (
    <div className="flex gap-1">
      <DigitCard digit={value[0]} />
      <DigitCard digit={value[1]} />
    </div>
  );

  return (
    <RelojShell
      top={null}
      digits={
        <>
          <Group value={hours} />
          <span className="text-lg font-bold text-zinc-300 dark:text-zinc-600">:</span>
          <Group value={minutes} />
        </>
      }
      bottom={
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {periodo}
        </span>
      }
    />
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
const esVencida = (cita, ahora) => {
  const fechaHora = new Date(`${cita.fecha}T${cita.hora_inicio}`);
  return fechaHora < ahora;
};

// Duración de la cita en segundos, a partir de hora_inicio y hora_fin
const calcularDuracionSegundos = (cita) => {
  const inicio = new Date(`2000-01-01T${cita.hora_inicio}`);
  const fin = new Date(`2000-01-01T${cita.hora_fin}`);
  return Math.max(0, Math.round((fin - inicio) / 1000));
};
const ConfirmarCancelacionModal = ({ cita, onConfirmar, onCerrar, procesando }) => {
  if (!cita) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 shadow-lg">
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          ¿Cancelar esta cita?
        </h3>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Vas a cancelar la cita de{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            {cita.usuario_nombre}
          </span>
          . Esta acción no se puede deshacer.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCerrar}
            disabled={procesando}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => onConfirmar(cita.id)}
            disabled={procesando}
            className="rounded-md bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {procesando ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AgendaSection = () => {
  const ahora = useHoraServidor();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalCitas, setTotalCitas] = useState(0);
  const [tab, setTab] = useState("pendiente"); // "pendiente" | "confirmada" | "cancelada"
  const [confirmando, setConfirmando] = useState(null);
  const [duracionCronometro, setDuracionCronometro] = useState(null);
  const [arrastrandoSobreReloj, setArrastrandoSobreReloj] = useState(false);
  const [citaAlerta, setCitaAlerta] = useState(null);
  const [procesandoAlerta, setProcesandoAlerta] = useState(false);
  const [completando, setCompletando] = useState(null);
  const [citaEnCurso, setCitaEnCurso] = useState(null);
  const [completandoEnCurso, setCompletandoEnCurso] = useState(false);
  const [cancelando, setCancelando] = useState(null);
  const [citaAReagendar, setCitaAReagendar] = useState(null);
  const [procesandoReagendar, setProcesandoReagendar] = useState(false); 
  const [toast, setToast] = useState(null); 
  const [citaAConfirmarCancelacion, setCitaAConfirmarCancelacion] = useState(null);

  

  const handleConfirmar = async (citaId) => {
    try {
      setConfirmando(citaId);
      const citaActualizada = await confirmarCita(citaId);
      setCitas((prev) =>
        prev.map((c) => (c.id === citaId ? citaActualizada : c)).filter((c) => c.estado === "pendiente")
      );
      setToast({ tipo: "success", mensaje: "Cita confirmada correctamente." });
    } catch (err) {
      setError(err.message || "No se pudo confirmar la cita.");
      setToast({ tipo: "error", mensaje: err.message || "No se pudo confirmar la cita." });
    } finally {
      setConfirmando(null);
    }
  };
  const handleCompletar = async (citaId) => {
    try {
      setCompletando(citaId);
      await completarCita(citaId);
      setCitas((prev) => prev.filter((c) => c.id !== citaId));
      setTotalCitas((c) => Math.max(0, c - 1));
    } catch (err) {
      setError(err.message || "No se pudo completar la cita.");
    } finally {
      setCompletando(null);
    }
  };
  const handleCancelar = async (citaId) => {
    try {
      setCancelando(citaId);
      await cancelarCita(citaId);
      setCitas((prev) => prev.filter((c) => c.id !== citaId));
      setTotalCitas((c) => Math.max(0, c - 1));
    } catch (err) {
      setError(err.message || "No se pudo cancelar la cita.");
    } finally {
      setCancelando(null);
    }
  };
  const handleReagendarSubmit = async (citaId, { fecha, hora_inicio, hora_fin }) => {
    try {
      setProcesandoReagendar(true);
      const citaActualizada = await reagendarCita(citaId, { fecha, hora_inicio, hora_fin });

      setCitas((prev) => {
        const siguePerteneciendo = citaActualizada.estado === tab;
        if (siguePerteneciendo) {
          // Sigue confirmada: solo actualizamos sus datos (nueva fecha/hora)
          return prev.map((c) => (c.id === citaId ? citaActualizada : c));
        }
        // Ya no pertenece a este tab (pasó a pendiente): la quitamos
        setTotalCitas((c) => Math.max(0, c - 1));
        return prev.filter((c) => c.id !== citaId);
      });

      setCitaAReagendar(null);
      setToast({ tipo: "success", mensaje: "Cita reagendada correctamente." });
    } catch (err) {
      setToast({
        tipo: "error",
        mensaje: err.message || "No se pudo reagendar la cita.",
      });
      throw err;
    } finally {
      setProcesandoReagendar(false);
    }
  };
  const obtenerSiguienteTurno = () => {
    return citas
      .filter((c) => c.estado === "confirmada" && !esVencida(c, ahora))
      .sort((a, b) => {
        const fechaHoraA = new Date(`${a.fecha}T${a.hora_inicio}`);
        const fechaHoraB = new Date(`${b.fecha}T${b.hora_inicio}`);
        return fechaHoraA - fechaHoraB;
      })[0] || null;
  };
  const handleIniciarSiguienteTurno = () => {
    const siguiente = obtenerSiguienteTurno();
    if (!siguiente) return;

    setCitas((prev) => prev.filter((c) => c.id !== siguiente.id));
    setTotalCitas((c) => Math.max(0, c - 1));
    setCitaEnCurso(siguiente);
    setDuracionCronometro(calcularDuracionSegundos(siguiente));
  };
  const handleCompletarEnCurso = async () => {
    if (!citaEnCurso) return;
    try {
      setCompletandoEnCurso(true);
      await completarCita(citaEnCurso.id);
      setDuracionCronometro(null);
      setCitaEnCurso(null);
    } catch (err) {
      setError(err.message || "No se pudo completar la cita.");
    } finally {
      setCompletandoEnCurso(false);
    }
  };

  useEffect(() => {
    const cargarCitas = async () => {
      try {
        setCargando(true);
        setError(null);
        const data = await getCitas({
          estado: tab,
          page: pagina,
          page_size: CITAS_POR_PAGINA,
        });
        setCitas(data.results);
        setTotalCitas(data.count);
      } catch (err) {
        setError(err.message || "Error al cargar las citas.");
      } finally {
        setCargando(false);
      }
    };

    cargarCitas();
  }, [tab, pagina]);

  // Al cambiar de pestaña, siempre volvemos a la página 1
  useEffect(() => {
    setPagina(1);
  }, [tab]);

  const totalPaginas = Math.ceil(totalCitas / CITAS_POR_PAGINA) || 1;

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [totalPaginas, pagina]);

  const inicio = (pagina - 1) * CITAS_POR_PAGINA;
  const citasPagina = citas.slice(inicio, inicio + CITAS_POR_PAGINA);



  const manejarMensajeSocket = (tipo, cita) => {
    if (tipo === "creada") {
      setCitaAlerta(cita);
      if (tab === "pendiente") {
        setCitas((prev) => [cita, ...prev]);
        setTotalCitas((c) => c + 1);
      }
      return;
    }

    // confirmada / cancelada / actualizada
    setCitas((prev) => {
      const yaEstaba = prev.some((c) => c.id === cita.id);
      const perteneceATab = cita.estado === tab;

      if (perteneceATab) {
        return yaEstaba
          ? prev.map((c) => (c.id === cita.id ? cita : c))
          : prev; // si no estaba y cambió al tab actual, lo dejamos para el siguiente refresh
      }
      if (yaEstaba) {
        setTotalCitas((c) => Math.max(0, c - 1));
        return prev.filter((c) => c.id !== cita.id);
      }
      return prev;
    });

    setCitaAlerta((actual) => (actual?.id === cita.id ? null : actual));
  };
  useCitasSocket(manejarMensajeSocket);




  const handleConfirmarDesdeModal = async (citaId) => {
    try {
      setProcesandoAlerta(true);
      await confirmarCita(citaId);
      setCitaAlerta(null);
    } catch (err) {
      setError(err.message || "No se pudo confirmar la cita.");
    } finally {
      setProcesandoAlerta(false);
    }
  };

  const handleCancelarDesdeModal = async (citaId) => {
    try {
      setProcesandoAlerta(true);
      await cancelarCita(citaId);
      setCitaAlerta(null);
    } catch (err) {
      setError(err.message || "No se pudo cancelar la cita.");
    } finally {
      setProcesandoAlerta(false);
    }
  };
  const handleAbrirReagendar = (cita) => {
    setCitaAReagendar(cita); // dispara el modal/formulario de reagendado
  };
  const labelEstado = {
    pendiente: "pendientes",
    confirmada: "confirmadas",
    completada: "completadas",
    cancelada: "canceladas",
  }[tab];

  

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

      <div className="flex gap-1 mb-4 border-b border-zinc-100 dark:border-zinc-800">
        {[
          { key: "pendiente", label: "Pendientes" },
          { key: "confirmada", label: "Confirmadas" },
          { key: "completada", label: "Completadas" },
          { key: "cancelada", label: "Canceladas" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl  bg-white dark:bg-zinc-900 grid grid-cols-1 md:grid-cols-[1.4fr_1fr]   ">
  
        {/* Columna izquierda: lista de citas pendientes */}
        <div className="p-4">
         

          {cargando ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">
              Cargando citas...
            </p>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-8">{error}</p>
          ) : citas.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">
              No tienes citas {labelEstado}.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {citasPagina.map((cita) => {
                  const iniciales = (cita.usuario_nombre || "?")
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const colorEstado = {
                    pendiente: "bg-amber-400",
                    confirmada: "bg-blue-400",
                    completada: "bg-emerald-400",
                    cancelada: "bg-red-400",
                  }[cita.estado];

                  return (
                    <li
                      key={cita.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(cita.id));
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="group flex items-center gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors cursor-grab active:cursor-grabbing"
                    >
                      {/* Indicador de estado */}
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorEstado}`} />

                      {/* Avatar con iniciales */}
                      <span className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                        {iniciales}
                      </span>

                      {/* Info principal */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                            {cita.usuario_nombre}
                          </p>
                          {/* {esVencida(cita, ahora) && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                              Vencida
                            </span>
                          )} */}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatHora(cita.hora_inicio)}
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-300">
                            {formatFecha(cita.fecha)}
                          </span>
                        </div>
                      </div>

                     
                      {/* Acciones */}
                      <div className="shrink-0 flex items-center gap-1.5 justify-end">
                        {tab === "pendiente" && (
                          <>
                            <button
                              onClick={() => handleConfirmar(cita.id)}
                              disabled={confirmando === cita.id}
                              className="flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {confirmando === cita.id ? "..." : "Confirmar"}
                            </button>

                            <button
                              onClick={() => setCitaAConfirmarCancelacion(cita)}
                              disabled={cancelando === cita.id}
                              className="flex items-center gap-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1.5 text-xs font-medium hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {cancelando === cita.id ? "..." : <XCircle className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}

                        {tab === "confirmada" && (
                          <>
                            <button
                              onClick={() => handleCompletar(cita.id)}
                              disabled={completando === cita.id}
                              className="flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {completando === cita.id ? (
                                "..."
                              ) : (
                                <>
                                  {/* <Check className="w-3.5 h-3.5" /> */}
                                  Escoger
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleAbrirReagendar(cita)}
                              className="flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                              title="Reagendar"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setCitaAConfirmarCancelacion(cita)}
                              disabled={cancelando === cita.id}
                              className="flex items-center gap-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1.5 text-xs font-medium hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {cancelando === cita.id ? "..." : <XCircle className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
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
          className={`p-4 transition-colors sticky top-4 self-start flex flex-col gap-2 ${
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
              setCitas((prev) => prev.filter((c) => c.id !== cita.id));
              setTotalCitas((c) => Math.max(0, c - 1));
              setCitaEnCurso(cita);
              setDuracionCronometro(calcularDuracionSegundos(cita));
            }
          }}
        >
          {duracionCronometro !== null ? (
            <>
              <Cronometro
                segundosIniciales={duracionCronometro}
                servicio={citaEnCurso?.servicio_nombre}
                onTerminar={() => {
                  setDuracionCronometro(null);
                  setCitaEnCurso(null);
                }}
                onCancelar={() => {
                  setDuracionCronometro(null);
                  setCitaEnCurso(null);
                }}
              />
              {citaEnCurso && (
                <button
                  onClick={handleCompletarEnCurso}
                  disabled={completandoEnCurso}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  {completandoEnCurso ? "Completando..." : "Completar"}
                </button>
              )}
            </>
          ) : (
            <>
              <FlipClock />
              <button
                onClick={handleIniciarSiguienteTurno}
                disabled={!obtenerSiguienteTurno()}
                className="group w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current relative transition-transform group-hover:translate-x-0.5" />
                Iniciar siguiente turno
              </button>
            </>
          )}
        </div>
      </div>

      <CitaAlertaModal
        cita={citaAlerta}
        onConfirmar={handleConfirmarDesdeModal}
        onCancelar={handleCancelarDesdeModal}
        onCerrar={() => setCitaAlerta(null)}
        procesando={procesandoAlerta}
      />
      <ReagendarModal
        cita={citaAReagendar}
        onReagendar={handleReagendarSubmit}
        onCerrar={() => setCitaAReagendar(null)}
        procesando={procesandoReagendar}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
        <ConfirmarCancelacionModal
          cita={citaAConfirmarCancelacion}
          procesando={cancelando === citaAConfirmarCancelacion?.id}
          onCerrar={() => setCitaAConfirmarCancelacion(null)}
          onConfirmar={async (citaId) => {
            await handleCancelar(citaId);
            setCitaAConfirmarCancelacion(null);
          }}
        />
    </div>
  );
};

export default AgendaSection;