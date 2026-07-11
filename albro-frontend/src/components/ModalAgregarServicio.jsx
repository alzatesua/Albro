import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import Portal from "./ui/Portal";
import { getCategorias, getServiciosPorCategoria, agregarServicio } from "../services/api";

const ModalAgregarServicio = ({ onClose, onCreado, onNotificar }) => {
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [categoriaId, setCategoriaId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [precio, setPrecio] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState("");

  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Carga categorías al abrir el modal
  useEffect(() => {
    let activo = true;
    getCategorias()
      .then((data) => {
        if (activo) setCategorias(data.categorias || data || []);
      })
      .catch(() => {
        if (activo) setError("No se pudieron cargar las categorías.");
      })
      .finally(() => {
        if (activo) setCargandoCategorias(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  // Carga servicios cuando cambia la categoría
  useEffect(() => {
    if (!categoriaId) {
      setServicios([]);
      setServicioId("");
      return;
    }

    let activo = true;
    setCargandoServicios(true);
    setServicioId("");

    getServiciosPorCategoria(categoriaId)
      .then((data) => {
        if (activo) setServicios(data.servicios || data || []);
      })
      .catch(() => {
        if (activo) setError("No se pudieron cargar los servicios de esa categoría.");
      })
      .finally(() => {
        if (activo) setCargandoServicios(false);
      });

    return () => {
      activo = false;
    };
  }, [categoriaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!servicioId || !precio || !duracionMinutos) {
      onNotificar?.({
        mensaje: "Completa todos los campos.",
        tipo: "error",
      });
      return;
    }

    setGuardando(true);
    try {
      const data = await agregarServicio({
        servicio_id: Number(servicioId),
        precio: Number(precio),
        duracion_minutos: Number(duracionMinutos),
      });

      onNotificar?.({
        mensaje: data?.mensaje || "Servicio agregado correctamente.",
        tipo: "success",
      });
      onCreado?.();
      onClose();
    } catch (err) {
      onNotificar?.({
        mensaje: err.message || "No se pudo agregar el servicio.",
        tipo: "error",
      });
    } finally {
      setGuardando(false);
    }
  };

  const formatearConPuntos = (valor) => {
    const soloNumeros = valor.replace(/\D/g, ""); 
    if (!soloNumeros) return "";
    return new Intl.NumberFormat("es-CO").format(Number(soloNumeros));
  };

  const limpiarNumero = (valorFormateado) => valorFormateado.replace(/\D/g, "");

  return (
    <Portal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-5 animate__animated animate__fadeInUp animate__faster">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Agregar servicio
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar"
            >
              <X size={15} />
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Categoría */}
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                Categoría
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                disabled={cargandoCategorias}
                className="w-full text-sm px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
              >
                <option value="">
                  {cargandoCategorias ? "Cargando..." : "Selecciona una categoría"}
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Servicio */}
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                Servicio
              </label>
              <select
                value={servicioId}
                onChange={(e) => setServicioId(e.target.value)}
                disabled={!categoriaId || cargandoServicios}
                className="w-full text-sm px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 disabled:opacity-60"
              >
                <option value="">
                  {!categoriaId
                    ? "Primero elige una categoría"
                    : cargandoServicios
                    ? "Cargando..."
                    : "Selecciona un servicio"}
                </option>
                {servicios.map((serv) => (
                  <option key={serv.id} value={serv.id}>
                    {serv.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio y duración */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                  Precio
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatearConPuntos(precio)}
                  onChange={(e) => setPrecio(limpiarNumero(e.target.value))}
                  placeholder="25.000"
                  className="w-full text-sm px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                  Duración promedio (min)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={duracionMinutos}
                  onChange={(e) => setDuracionMinutos(e.target.value)}
                  placeholder="40"
                  className="w-full text-sm px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {guardando && <Loader2 size={14} className="animate-spin" />}
              {guardando ? "Creando..." : "Crear servicio"}
            </button>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default ModalAgregarServicio;