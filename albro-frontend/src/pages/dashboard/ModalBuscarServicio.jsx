import { useState, useEffect } from "react";
import { Check, Gavel, UserSearch, Search, ArrowLeft, ArrowRight, Loader2, CalendarDays, Clock } from "lucide-react";
import {
  getCategorias,
  getServiciosPorCategoria,
  getProfesionalesPorServicio,
  getAgendaProfesional,
} from "@/services/api";

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
const hoyISO = () => new Date().toISOString().split("T")[0];

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
const ModalBuscarServicio = ({ onClose, onBuscar }) => {
  const [pasoActual, setPasoActual] = useState(1);

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

  const profesionalesFiltrados = profesionales.filter((p) =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(busquedaProfesional.toLowerCase())
  );

  // ── Cargar categorías al montar el modal ──────────────────────────────
  useEffect(() => {
    setCargandoCategorias(true);
    setErrorCategorias("");
    getCategorias()
      .then((data) => setCategorias(data))
      .catch((err) => setErrorCategorias(err.message || "No se pudieron cargar las categorías."))
      .finally(() => setCargandoCategorias(false));
  }, []);

  // ── Cargar servicios cuando cambia la categoría seleccionada ──────────
  useEffect(() => {
    if (!categoriaSel) {
      setServicios([]);
      return;
    }
    setCargandoServicios(true);
    setErrorServicios("");
    getServiciosPorCategoria(categoriaSel)
      .then((data) => setServicios(data))
      .catch((err) => setErrorServicios(err.message || "No se pudieron cargar los servicios."))
      .finally(() => setCargandoServicios(false));
  }, [categoriaSel]);

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
    setModo(null);
    setPrecio("");
    setProfesionalSel(null);
    setFecha("");
    setAgenda(null);
    setCupoSel(null);
    setTimeout(() => setPasoActual(3), 300);
  };

  const handleModo = (nuevoModo) => {
    setModo(nuevoModo);
    setPrecio("");
    setProfesionalSel(null);
    setBusquedaProfesional("");
    setFecha("");
    setAgenda(null);
    setCupoSel(null);
    setTimeout(() => setPasoActual(4), 300);
  };

  // ── Nuevo: seleccionar profesional avanza automáticamente al paso 5 ───
  const handleProfesional = (id) => {
    setProfesionalSel(id);
    setFecha("");
    setAgenda(null);
    setCupoSel(null);
    setTimeout(() => setPasoActual(5), 300);
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

  const handleConfirmar = () => {
    onBuscar({
      categoriaSel,
      servicioSel,
      modo,
      precio,
      profesionalSel,
      fecha,
      horario: cupoSel, // { hora_inicio, hora_fin, etiqueta }
    });
  };

  return (
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
            <button
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
            </button>

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
                {profesionalesFiltrados.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => handleProfesional(prof.id)}
                    className={`border rounded-xl px-3 py-2.5 text-sm flex items-center justify-between transition-colors
                      ${profesionalSel === prof.id
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                  >
                    <span className="flex flex-col items-start text-left">
                      <span className={profesionalSel === prof.id ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}>
                        {prof.nombre} {prof.apellido}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {prof.nombre_local}
                        {prof.precio_servicio && (
                          <> · ${Number(prof.precio_servicio).toLocaleString("es-CO")}</>
                        )}
                      </span>
                    </span>
                    {profesionalSel === prof.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Paso 5 (profesional): fecha y hora ──────────────────────── */}
        {pasoActual === 5 && modo === "profesional" && (
          <div className="min-h-[180px]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <CalendarDays size={15} />
                Elige fecha y hora
              </p>

              {agenda && (
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    ${Number(agenda.precio).toLocaleString("es-CO")}
                  </span>
                  <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-600" />
                  <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <Clock size={12} />
                    {agenda.duracion_minutos} min
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center mb-4">
              <input
                type="date"
                value={fecha}
                min={hoyISO()}
                onChange={(e) => setFecha(e.target.value)}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 w-full max-w-[220px] text-center"
              />
            </div>

            {!fecha && (
              <div className="flex flex-col items-center gap-2 py-10">
                <CalendarDays size={28} className="text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center">
                  Selecciona una fecha para ver los horarios disponibles.
                </p>
              </div>
            )}

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
              disabled={!puedeConfirmar}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {modo === "subasta" ? "Subastar servicio" : "Agendar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalBuscarServicio;