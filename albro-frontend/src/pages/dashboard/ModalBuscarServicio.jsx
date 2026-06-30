import { useState } from "react";
import { Check, Gavel, UserSearch, Star, Search, ArrowLeft, ArrowRight } from "lucide-react";

// ─── Datos mock — luego vienen del backend ────────────────────────────────
const CATEGORIAS_MOCK = [
  { id: "barberia", nombre: "Barbería" },
  { id: "unas", nombre: "Uñas" },
  { id: "maquillaje", nombre: "Maquillaje" },
  { id: "masajes", nombre: "Masajes" },
  { id: "skincare", nombre: "Skincare" },
];

const SERVICIOS_MOCK = {
  barberia: [
    { id: "corte", nombre: "Corte de cabello" },
    { id: "afeitado", nombre: "Afeitado" },
    { id: "barba", nombre: "Arreglo de barba" },
  ],
  unas: [
    { id: "manicure", nombre: "Manicure" },
    { id: "pedicure", nombre: "Pedicure" },
  ],
  maquillaje: [
    { id: "social", nombre: "Maquillaje social" },
    { id: "novia", nombre: "Maquillaje de novia" },
  ],
  masajes: [
    { id: "relajante", nombre: "Masaje relajante" },
    { id: "deportivo", nombre: "Masaje deportivo" },
  ],
  skincare: [
    { id: "facial", nombre: "Limpieza facial" },
    { id: "hidratacion", nombre: "Hidratación profunda" },
  ],
};

// Profesionales mock — luego vienen del backend filtrados por servicio
const PROFESIONALES_MOCK = [
  { id: "p1", nombre: "Camila Rojas", rating: 4.9, precioDesde: 25000 },
  { id: "p2", nombre: "Andrés Tobón", rating: 4.7, precioDesde: 30000 },
  { id: "p3", nombre: "Laura Gómez", rating: 4.8, precioDesde: 28000 },
  { id: "p4", nombre: "Juan Pérez", rating: 4.6, precioDesde: 22000 },
];

const PASOS = [
  { id: 1, label: "Categoría" },
  { id: 2, label: "Servicio" },
  { id: 3, label: "Modalidad" },
  { id: 4, label: "Detalle" },
];

// ─── Stepper horizontal ─────────────────────────────────────────────────────
const Stepper = ({ pasoActual }) => (
  <div className="flex items-center mb-6">
    {PASOS.map((paso, i) => {
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
          {i < PASOS.length - 1 && (
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
  const [categoriaSel, setCategoriaSel] = useState(null);
  const [servicioSel, setServicioSel] = useState(null);
  const [modo, setModo] = useState(null); // "subasta" | "profesional"
  const [precio, setPrecio] = useState("");
  const [busquedaProfesional, setBusquedaProfesional] = useState("");
  const [profesionalSel, setProfesionalSel] = useState(null);

  const servicios = categoriaSel ? SERVICIOS_MOCK[categoriaSel] || [] : [];

  const profesionalesFiltrados = PROFESIONALES_MOCK.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaProfesional.toLowerCase())
  );

  const handleCategoria = (id) => {
    setCategoriaSel(id);
    setServicioSel(null);
    setModo(null);
    setPrecio("");
    setProfesionalSel(null);
    setTimeout(() => setPasoActual(2), 300);
  };

  const handleServicio = (id) => {
    setServicioSel(id);
    setModo(null);
    setPrecio("");
    setProfesionalSel(null);
    setTimeout(() => setPasoActual(3), 300);
  };

  const handleModo = (nuevoModo) => {
    setModo(nuevoModo);
    setPrecio("");
    setProfesionalSel(null);
    setBusquedaProfesional("");
    setTimeout(() => setPasoActual(4), 300);
  };

  const puedeAvanzar = () => {
    if (pasoActual === 1) return !!categoriaSel;
    if (pasoActual === 2) return !!servicioSel;
    if (pasoActual === 3) return !!modo;
    return false;
  };

  const puedeConfirmar =
    modo === "subasta"
      ? precio.trim() !== ""
      : modo === "profesional"
      ? !!profesionalSel
      : false;

  const siguiente = () => puedeAvanzar() && setPasoActual((p) => Math.min(p + 1, 4));
  const atras = () => setPasoActual((p) => Math.max(p - 1, 1));

  const handleConfirmar = () => {
    onBuscar({ categoriaSel, servicioSel, modo, precio, profesionalSel });
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

        <Stepper pasoActual={pasoActual} />

        {/* ── Paso 1: Categoría ───────────────────────────────────────── */}
        {pasoActual === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-h-[180px]">
            {CATEGORIAS_MOCK.map((cat) => (
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

        {/* ── Paso 2: Servicio ────────────────────────────────────────── */}
        {pasoActual === 2 && (
          <div className="grid grid-cols-2 gap-2 min-h-[180px]">
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

        {/* ── Paso 4: Detalle (precio o profesional) ──────────────────── */}
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

        {pasoActual === 4 && modo === "profesional" && (
          <div className="min-h-[180px]">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Busca y elige un profesional
            </p>
            <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 mb-3 max-w-sm">
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

            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
              {profesionalesFiltrados.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 col-span-2 text-center py-3">
                  No se encontraron profesionales.
                </p>
              )}
              {profesionalesFiltrados.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => setProfesionalSel(prof.id)}
                  className={`border rounded-xl px-3 py-2.5 text-sm flex items-center justify-between transition-colors
                    ${profesionalSel === prof.id
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                >
                  <span className="flex flex-col items-start text-left">
                    <span className={profesionalSel === prof.id ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}>
                      {prof.nombre}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                      <Star size={10} className="fill-current" />
                      {prof.rating} · desde ${prof.precioDesde.toLocaleString("es-CO")}
                    </span>
                  </span>
                  {profesionalSel === prof.id && <Check size={16} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
                </button>
              ))}
            </div>
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

          {pasoActual < 4 ? (
            <button
              onClick={siguiente}
              disabled={!puedeAvanzar()}
              className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
              <ArrowRight size={15} />
            </button>
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