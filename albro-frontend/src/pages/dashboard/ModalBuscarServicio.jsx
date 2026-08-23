import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotificacionesWS } from "@/hooks/useNotificacionesWS";
import Portal from "@/components/ui/Portal";
import ModalRequiereLogin from "@/components/ModalRequiereLogin";
import { Check, Gavel, UserSearch, Search, ArrowLeft, ArrowRight, Loader2, CalendarDays, Clock } from "lucide-react";
import {
  getCategorias,
  getServiciosPorCategoria,
  getProfesionalesPorServicio,
  getAgendaProfesional,
  crearCita,
  getServiciosDeProfesional,
} from "@/services/api";

const MEDIA_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");

const PASOS_BASE = [
  { id: 1, label: "Categoría" },
  { id: 2, label: "Servicio" },
  { id: 3, label: "Modalidad" },
];

const getPasos = (modo) => {
  if (modo === "profesional") {
    return [
      ...PASOS_BASE,
      { id: 4, label: "Profesional" },
      { id: 5, label: "Fecha y hora" },
    ];
  }
  return [...PASOS_BASE, { id: 4, label: "Detalle" }];
};

// Fecha mínima seleccionable: hoy, en formato YYYY-MM-DD
const hoyISO = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
// ─── Stepper horizontal ─────────────────────────────────────────────────────
const Stepper = ({ pasoActual, pasos }) => (
  <div className="flex items-center mb-6">
    {pasos.map((paso, i) => {
      const completado = paso.id < pasoActual;
      const activo = paso.id === pasoActual;
      return (
        <div key={paso.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors
                ${completado
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : activo
                  ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"}`}
            >
              {completado ? <Check size={15} /> : paso.id}
            </div>
            <span
              className={`text-[11px] whitespace-nowrap ${
                activo ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {paso.label}
            </span>
          </div>
          {i < pasos.length - 1 && (
            <div
              className={`flex-1 h-[2px] mx-2 -mt-4 transition-colors ${
                completado ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          )}
        </div>
      );
    })}
  </div>
);



// ─── Modal de búsqueda ──────────────────────────────────────────────────────
const ModalBuscarServicio = ({ onClose, onBuscar, onNotificar, profesionalPreseleccionado }) => {
  const { usuario } = useAuth();
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState("");

  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [errorServicios, setErrorServicios] = useState("");

  const [profesionales, setProfesionales] = useState([]);
  const [cargandoProfesionales, setCargandoProfesionales] = useState(false);
  const [errorProfesionales, setErrorProfesionales] = useState("");

  const [categoriaSel, setCategoriaSel] = useState(null);
  const [servicioSel, setServicioSel] = useState(null);
  const [modo, setModo] = useState(null); // "subasta" | "profesional"
  const [precio, setPrecio] = useState("");
  const [busquedaProfesional, setBusquedaProfesional] = useState("");
  const [profesionalSel, setProfesionalSel] = useState(null);

  // ── Nuevo: agenda (fecha + horario) ────────────────────────────────────
  const [fecha, setFecha] = useState("");
  const [agenda, setAgenda] = useState(null);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);
  const [errorAgenda, setErrorAgenda] = useState("");
  const [cupoSel, setCupoSel] = useState(null); // { hora_inicio, hora_fin, etiqueta }

  const pasos = getPasos(modo);
  const totalPasos = pasos.length;
  const [enviandoCita, setEnviandoCita] = useState(false);

  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(false);
  const fechaInputRef = useRef(null);
  const profesionalesFiltrados = profesionales.filter((p) =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(busquedaProfesional.toLowerCase())
  );

  // ── Cargar categorías al montar el modal ──────────────────────────────
useEffect(() => {
  setCargandoCategorias(true);
  setErrorCategorias("");

  if (profesionalPreseleccionado) {
    getServiciosDeProfesional(profesionalPreseleccionado.id)
      .then((data) => {
        const serviciosProf = data.servicios || [];
        // Deduplica categorías a partir de los servicios reales del profesional
        const vistas = new Set();
        const categoriasDelProfesional = [];
        serviciosProf.forEach((s) => {
          if (s.categoria != null && !vistas.has(s.categoria)) {
            vistas.add(s.categoria);
            categoriasDelProfesional.push({
              id: s.categoria,
              nombre: s.categoria_nombre,
            });
          }
        });
        setCategorias(categoriasDelProfesional);
      })
      .catch((err) => setErrorCategorias(err.message || "No se pudieron cargar las categorías."))
      .finally(() => setCargandoCategorias(false));
  } else {
    getCategorias()
      .then((data) => setCategorias(data))
      .catch((err) => setErrorCategorias(err.message || "No se pudieron cargar las categorías."))
      .finally(() => setCargandoCategorias(false));
  }
}, [profesionalPreseleccionado]);

  // ── Cargar servicios cuando cambia la categoría seleccionada ──────────
  useEffect(() => {
    if (!categoriaSel) {
      setServicios([]);
      return;
    }
    setCargandoServicios(true);
    setErrorServicios("");

    const promesa = profesionalPreseleccionado
      ? getServiciosDeProfesional(profesionalPreseleccionado.id).then((data) =>
          // filtramos localmente por la categoría elegida, ya que el endpoint trae TODOS los servicios del profesional
          (data.servicios || []).filter((s) => s.categoria === categoriaSel)
        )
      : getServiciosPorCategoria(categoriaSel);

    promesa
      .then((data) => setServicios(data))
      .catch((err) => setErrorServicios(err.message || "No se pudieron cargar los servicios."))
      .finally(() => setCargandoServicios(false));
  }, [categoriaSel, profesionalPreseleccionado]);

  // ── Cargar profesionales cuando se entra al paso 4 en modo "profesional" ──
  useEffect(() => {
    if (modo !== "profesional" || !servicioSel) {
      setProfesionales([]);
      return;
    }
    setCargandoProfesionales(true);
    setErrorProfesionales("");
    getProfesionalesPorServicio(servicioSel)
      .then((data) => setProfesionales(data))
      .catch((err) => setErrorProfesionales(err.message || "No se pudieron cargar los profesionales."))
      .finally(() => setCargandoProfesionales(false));
  }, [modo, servicioSel]);

  // ── Nuevo: cargar agenda cuando hay profesional + servicio + fecha ────
  useEffect(() => {
    if (modo !== "profesional" || !profesionalSel || !servicioSel || !fecha) {
      setAgenda(null);
      return;
    }
    setCargandoAgenda(true);
    setErrorAgenda("");
    setCupoSel(null);
    getAgendaProfesional(profesionalSel, servicioSel, fecha)
      .then((data) => setAgenda(data))
      .catch((err) => setErrorAgenda(err.message || "No se pudo cargar la disponibilidad."))
      .finally(() => setCargandoAgenda(false));
  }, [modo, profesionalSel, servicioSel, fecha]);

  const irAPasoProtegido = (paso) => {
    if (!usuario) {
      setMostrarModalLogin(true);
      return;
    }
    setPasoActual(paso);
  };

  const handleCategoria = (id) => {
    setCategoriaSel(id);
    setServicioSel(null);
    setModo(null);
    setPrecio("");
    setProfesionalSel(null);
    setFecha("");
    setAgenda(null);
    setCupoSel(null);
    setTimeout(() => setPasoActual(2), 300);
  };

  const handleServicio = (id) => {
    setServicioSel(id);
    setPrecio("");
    setFecha("");
    setAgenda(null);
    setCupoSel(null);

    if (profesionalPreseleccionado) {
      // Ya sabemos quién es el profesional (viene del pin del mapa): saltamos Modalidad y Profesional
      setModo("profesional");
      setProfesionalSel(profesionalPreseleccionado.id);
      setTimeout(() => irAPasoProtegido(5), 300);
    } else {
      setModo(null);
      setProfesionalSel(null);
      setTimeout(() => setPasoActual(3), 300);
    }
  };

  const handleModo = (nuevoModo) => {
    setModo(nuevoModo);
    setPrecio("");
    setProfesionalSel(null);
    setBusquedaProfesional("");
    setFecha("");
    setAgenda(null);
    setCupoSel(null);
    setTimeout(() => irAPasoProtegido(4), 300);
  };

  // ── Nuevo: seleccionar profesional avanza automáticamente al paso 5 ───
  const handleProfesional = (id) => {
    setProfesionalSel(id);
    setFecha("");
    setAgenda(null);
    setCupoSel(null);
    setTimeout(() => irAPasoProtegido(5), 300);
  };

  const puedeAvanzar = () => {
    if (pasoActual === 1) return !!categoriaSel;
    if (pasoActual === 2) return !!servicioSel;
    if (pasoActual === 3) return !!modo;
    return false;
  };

  const esUltimoPaso =
    (modo === "subasta" && pasoActual === 4) ||
    (modo === "profesional" && pasoActual === 5);

  const puedeConfirmar =
    modo === "subasta"
      ? precio.trim() !== ""
      : modo === "profesional"
      ? !!cupoSel
      : false;

  const siguiente = () => puedeAvanzar() && setPasoActual((p) => Math.min(p + 1, totalPasos));
  const atras = () => setPasoActual((p) => Math.max(p - 1, 1));

  const handleConfirmar = async () => {
    if (modo === "profesional") {
      if (!cupoSel || !profesionalSel || !servicioSel || !fecha) return;

      setEnviandoCita(true);

      const payload = {
        cliente: usuario?.id,
        profesional: profesionalSel,
        servicio: servicioSel,
        ...(categoriaSel ? { categoria: categoriaSel } : {}),
        fecha,
        hora_inicio: cupoSel.hora_inicio,
        hora_fin: cupoSel.hora_fin,
        etiqueta: cupoSel.etiqueta,
        modo: "cliente",
      };

      try {
        const cita = await crearCita(payload);
        onNotificar?.({ tipo: "exito", mensaje: "¡Cita agendada con éxito!" });
        setTimeout(() => {
          onBuscar?.(cita);
          onClose();
        }, 1400);
      } catch (err) {
        onNotificar?.({
          tipo: "error",
          mensaje: err.message || "No se pudo agendar la cita. Intenta de nuevo.",
        });
      } finally {
        setEnviandoCita(false);
      }
      return;
    }

    // ── Modo subasta: comportamiento original ──
    const payload = {};
    if (categoriaSel) payload.categoria = categoriaSel;
    if (servicioSel) payload.servicio = servicioSel;
    if (modo) payload.modo = modo;
    if (precio) payload.precio = precio;
    if (usuario?.id) payload.usuario = usuario.id;
    console.log("Payload:", payload);
    onBuscar(payload);
  };

  useEffect(() => {
    if (pasoActual === 5 && modo === "profesional" && !fecha) {
      setFecha(hoyISO());
    }
  }, [pasoActual, modo]);
  
  // ── Ref con el estado "vivo" para evitar closures obsoletas en el WS ──
  const estadoVivoRef = useRef({ modo, profesionalSel, servicioSel, fecha, cupoSel });
  useEffect(() => {
    estadoVivoRef.current = { modo, profesionalSel, servicioSel, fecha, cupoSel };
  }, [modo, profesionalSel, servicioSel, fecha, cupoSel]);

  const handleCitaActualizada = useCallback((data) => {
    const cita = data?.cita;
    if (!cita) return;

    // Leemos SIEMPRE el estado actual desde el ref, no desde el closure
    const { modo, profesionalSel, servicioSel, fecha, cupoSel } = estadoVivoRef.current;

    const viendoEsteHorario =
      modo === "profesional" &&
      profesionalSel &&
      servicioSel &&
      fecha &&
      cita.profesional === profesionalSel &&
      cita.fecha === fecha;

    if (!viendoEsteHorario) return;

    getAgendaProfesional(profesionalSel, servicioSel, fecha)
      .then((nuevaAgenda) => {
        setAgenda(nuevaAgenda);

        if (cupoSel) {
          const sigueDisponible = nuevaAgenda.cupos_disponibles.some(
            (c) => c.hora_inicio === cupoSel.hora_inicio
          );
          if (!sigueDisponible) {
            setCupoSel(null);
            onNotificar?.({
              tipo: "error",
              mensaje: "Ese horario ya no está disponible, elige otro.",
            });
          }
        }
      })
      .catch(() => {});
  }, [onNotificar]); // ← ya NO depende de modo/profesionalSel/servicioSel/fecha/cupoSel

  useNotificacionesWS({ usuario, onCitaActualizada: handleCitaActualizada });


  

  return (
    <Portal>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center px-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
        >
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Buscar servicio</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Encuentra el profesional que necesitas en pocos pasos.
          </p>

          <Stepper pasoActual={pasoActual} pasos={pasos} />

          {/* ── Paso 1: Categoría ───────────────────────────────────────── */}
          {pasoActual === 1 && (
            <div className="min-h-[180px]">
              {cargandoCategorias && (
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 py-10">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando categorías...
                </div>
              )}
              {!cargandoCategorias && errorCategorias && (
                <p className="text-sm text-red-500 text-center py-10">{errorCategorias}</p>
              )}
              {!cargandoCategorias && !errorCategorias && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoria(cat.id)}
                      className={`rounded-xl border px-3 py-4 text-sm transition-colors
                        ${categoriaSel === cat.id
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Paso 2: Servicio ────────────────────────────────────────── */}
          {pasoActual === 2 && (
            <div className="min-h-[180px]">
              {cargandoServicios && (
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 py-10">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando servicios...
                </div>
              )}
              {!cargandoServicios && errorServicios && (
                <p className="text-sm text-red-500 text-center py-10">{errorServicios}</p>
              )}
              {!cargandoServicios && !errorServicios && (
                <div className="grid grid-cols-2 gap-2">
                  {servicios.length === 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 col-span-2 text-center py-6">
                      No hay servicios disponibles para esta categoría.
                    </p>
                  )}
                  {servicios.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => handleServicio(srv.id)}
                      className={`border rounded-xl px-3 py-3.5 text-sm flex items-center justify-between transition-colors
                        ${servicioSel === srv.id
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                    >
                      <span className={servicioSel === srv.id ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}>
                        {srv.nombre}
                      </span>
                      {servicioSel === srv.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Paso 3: Modalidad ───────────────────────────────────────── */}
          {pasoActual === 3 && (
            <div className="grid grid-cols-2 gap-4 min-h-[180px]">
             {/* <button
                onClick={() => handleModo("subasta")}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border px-4 py-8 transition-colors
                  ${modo === "subasta"
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
              >
                <Gavel size={28} className={modo === "subasta" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"} />
                
                <span className={`text-sm text-center ${modo === "subasta" ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}>
                  Subastar servicio
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-tight">
                  Pon tu precio y deja que los profesionales te contacten
                </span>
              </button>*/}

              <button
                onClick={() => handleModo("profesional")}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border px-4 py-8 transition-colors
                  ${modo === "profesional"
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
              >
                <UserSearch size={28} className={modo === "profesional" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"} />
                <span className={`text-sm text-center ${modo === "profesional" ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}>
                  Elegir profesional
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-tight">
                  Busca y agenda directamente con quien tú quieras
                </span>
              </button>
            </div>
          )}

          {/* ── Paso 4 (subasta): precio ─────────────────────────────────── */}
          {pasoActual === 4 && modo === "subasta" && (
            <div className="min-h-[180px]">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Cuánto deseas pagar
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">$</span>
                <input
                  type="text"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="35.000"
                  autoFocus
                  className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <span className="text-xs text-zinc-400 dark:text-zinc-500">COP</span>
              </div>
            </div>
          )}

          {/* ── Paso 4 (profesional): elegir profesional, ya NO confirma aquí ── */}
          {pasoActual === 4 && modo === "profesional" && (
            <div className="min-h-[180px]">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 text-center">
                Busca y elige un profesional
              </p>
              <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 mb-3 max-w-sm mx-auto">
                <Search size={15} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={busquedaProfesional}
                  onChange={(e) => setBusquedaProfesional(e.target.value)}
                  placeholder="Nombre del profesional"
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              {cargandoProfesionales && (
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 py-6">
                  <Loader2 size={16} className="animate-spin" />
                  Cargando profesionales...
                </div>
              )}

              {!cargandoProfesionales && errorProfesionales && (
                <p className="text-sm text-red-500 text-center py-6">{errorProfesionales}</p>
              )}

              {!cargandoProfesionales && !errorProfesionales && (
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                  {profesionalesFiltrados.length === 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 col-span-2 text-center py-3">
                      No se encontraron profesionales para este servicio.
                    </p>
                  )}
                  {profesionalesFiltrados.map((prof) => {
                    const iniciales = `${prof.nombre?.[0] ?? ""}${prof.apellido?.[0] ?? ""}`.toUpperCase();
                    const avatarUrl = prof.imagen_perfil
                      ? `${MEDIA_BASE_URL}${prof.imagen_perfil}`
                      : null;

                    return (
                      <button
                        key={prof.id}
                        onClick={() => handleProfesional(prof.id)}
                        className={`border rounded-xl px-3 py-2.5 text-sm flex items-center justify-between transition-colors
                          ${profesionalSel === prof.id
                            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                      >
                        <span className="flex items-start gap-2.5 text-left min-w-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${prof.nombre} ${prof.apellido}`}
                              className="w-12 h-12 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <span className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                              {iniciales || "?"}
                            </span>
                          )}
                          <span className="flex flex-col items-start truncate pt-0.5">
                            <span className={`truncate ${profesionalSel === prof.id ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                              {prof.nombre} {prof.apellido}
                            </span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                              {prof.nombre_local}
                              {prof.precio_servicio && (
                                <> · ${Number(prof.precio_servicio).toLocaleString("es-CO")}</>
                              )}
                            </span>
                            {(prof.direccion || prof.ubicacion) && (
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 truncate">
                                {prof.direccion}
                                {prof.direccion && prof.ubicacion && ", "}
                                {prof.ubicacion}
                              </span>
                            )}
                          </span>
                        </span>
                        {profesionalSel === prof.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Paso 5 (profesional): fecha y hora ──────────────────────── */}
          {pasoActual === 5 && modo === "profesional" && (
            <div className="min-h-[180px]">
              {profesionalPreseleccionado && (
                <div className="flex items-center gap-2.5 mb-4 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  {profesionalPreseleccionado.imagen_perfil ? (
                    <img
                      src={`${MEDIA_BASE_URL}${profesionalPreseleccionado.imagen_perfil}`}
                      alt={`${profesionalPreseleccionado.nombre} ${profesionalPreseleccionado.apellido}`}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                      {`${profesionalPreseleccionado.nombre?.[0] || ""}${profesionalPreseleccionado.apellido?.[0] || ""}`.toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Agendando con</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {profesionalPreseleccionado.nombre} {profesionalPreseleccionado.apellido}
                    </p>
                  </div>
                </div>
              )}


             <div className="flex flex-col items-center gap-2 mb-4">
              <div className="relative inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                <CalendarDays size={16} className="pointer-events-none" />
                <span className="pointer-events-none">Elegir otra fecha</span>
                <input
                  ref={fechaInputRef}
                  type="date"
                  value={fecha}
                  min={hoyISO()}
                  onChange={(e) => setFecha(e.target.value)}
                  onClick={(e) => {
                    // Mejora para desktop (Firefox/Safari a veces no abren con el clic nativo)
                    try {
                      e.currentTarget.showPicker?.();
                    } catch (err) {
                      // Si ya está abierto o no es soportado, no hacemos nada
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>
                          

              {fecha && cargandoAgenda && (
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 py-6">
                  <Loader2 size={16} className="animate-spin" />
                  Consultando disponibilidad...
                </div>
              )}

              {fecha && !cargandoAgenda && errorAgenda && (
                <p className="text-sm text-red-500 text-center py-6">{errorAgenda}</p>
              )}

              {fecha && !cargandoAgenda && !errorAgenda && agenda && (
                <>
                  {agenda.cupos_disponibles.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6 animate__animated animate__fadeIn">
                      No hay horarios disponibles para esta fecha. Prueba con otro día.
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto overflow-x-hidden">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 p-0.5">
                        {agenda.cupos_disponibles.map((cupo, index) => {
                          const seleccionado = cupoSel?.hora_inicio === cupo.hora_inicio;
                          return (
                            <button
                              key={cupo.hora_inicio}
                              onClick={() => setCupoSel(cupo)}
                              style={{ animationDelay: `${index * 40}ms` }}
                              className={`animate__animated animate__bounceIn border rounded-lg px-2 py-2 text-xs font-medium transition-colors
                                ${seleccionado
                                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                            >
                              {cupo.hora_inicio}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {cupoSel && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-3 animate__animated animate__fadeIn">
                      Tu cita será de <span className="font-medium text-zinc-900 dark:text-zinc-100">{cupoSel.etiqueta}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Navegación ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={atras}
              disabled={pasoActual === 1}
              className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 disabled:opacity-0 disabled:pointer-events-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft size={15} />
              Atrás
            </button>

            {!esUltimoPaso ? (
              pasoActual === 4 && modo === "profesional" ? null /* avance automático al elegir profesional */ : (
                <button
                  onClick={siguiente}
                  disabled={!puedeAvanzar()}
                  className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ArrowRight size={15} />
                </button>
              )
            ) : (
              <button
                onClick={handleConfirmar}
                disabled={!puedeConfirmar || enviandoCita}
                className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {enviandoCita && <Loader2 size={15} className="animate-spin" />}
                {modo === "subasta" ? "Subastar servicio" : enviandoCita ? "Agendando..." : "Agendar"}
              </button>
            )}
          </div>
        </div>
      </div>
        <ModalRequiereLogin
          abierto={mostrarModalLogin}
          onCancelar={() => setMostrarModalLogin(false)}
          onClose={onClose}
          titulo="Espera, necesitas una cuenta para agendar"
          mensaje="Inicia sesión o regístrate para ver la disponibilidad y confirmar tu cita."
          redirectTo="/dashboard"
        />
    </Portal>
  );
};

export default ModalBuscarServicio;
