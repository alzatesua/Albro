import { useState, useEffect, useCallback } from "react";
import ModalCodigoQR from "@/components/ModalCodigoQR";
import { getMiCatalogo, eliminarImagenPortafolio } from "@/services/api";
import { Star, Image as ImageIcon, MapPin, CircleDot, Trash2, Loader2, AlertTriangle, X, Clock, QrCode } from "lucide-react";
import Portal from "@/components/ui/Portal";

const MiCatalogoSection = () => {
  const [catalogo, setCatalogo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // ── Modal de confirmación para eliminar imagen ────────────────────────
  const [imagenAEliminar, setImagenAEliminar] = useState(null); // la imagen completa, no solo el id
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState(null);
  const [qrAbierto, setQrAbierto] = useState(false);


  const cargarCatalogo = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMiCatalogo();
      setCatalogo(data);
    } catch (err) {
      console.error("Error cargando mi catálogo:", err);
      setError(err.message || "No se pudo cargar tu catálogo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  const pedirConfirmacionEliminar = (imagen) => {
    setErrorEliminar(null);
    setImagenAEliminar(imagen);
  };

  const cancelarEliminar = () => {
    if (eliminando) return; // evita cerrar a mitad de la petición
    setImagenAEliminar(null);
    setErrorEliminar(null);
  };

  const confirmarEliminarImagen = async () => {
    if (!imagenAEliminar) return;

    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarImagenPortafolio(imagenAEliminar.id);
      setCatalogo((prev) => ({
        ...prev,
        portafolio: prev.portafolio.filter((img) => img.id !== imagenAEliminar.id),
      }));
      setImagenAEliminar(null);
    } catch (err) {
      console.error("Error eliminando imagen:", err);
      setErrorEliminar(err.message || "No se pudo eliminar la imagen.");
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) {
    return (
      <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
        Cargando tu catálogo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-red-500">{error}</div>
    );
  }

  if (!catalogo) return null;

  const { profesional, categorias, portafolio } = catalogo;

  return (
    <div className="space-y-8">
      {/* ── Encabezado del perfil ── */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
          {profesional.foto_perfil ? (
            <img
              src={profesional.foto_perfil}
              alt={profesional.nombre_local}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-zinc-400 dark:text-zinc-500">
              {profesional.nombre_local?.charAt(0)?.toUpperCase() || "?"}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {profesional.nombre_local}
            </h2>
            {profesional.estado && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CircleDot size={10} />
                {profesional.estado.nombre}
              </span>
              
            )}
            <button
                onClick={() => setQrAbierto(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                <QrCode size={14} />
                Compartir mi perfil
            </button>
          </div>

          {profesional.descripcion && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {profesional.descripcion}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {profesional.direccion && (
              <span className="flex items-center gap-1">
                {profesional.direccion}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              {profesional.promedio_calificacion ?? "Sin calificaciones"}
              {profesional.total_valoraciones > 0 && (
                <span className="text-zinc-400 dark:text-zinc-500">
                  ({profesional.total_valoraciones})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Servicios agrupados por categoría ── */}
    <div>
    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
        Servicios
    </h3>

    {categorias.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
        Aún no has agregado servicios a tu catálogo.
        </div>
    ) : (
        <div className="space-y-6">
        {categorias.map((categoria) => (
            <div key={categoria.id ?? "sin-categoria"}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
                {categoria.nombre}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoria.servicios.map((servicio) => (
                <div
                    key={servicio.id}
                    className="group rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-3 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all"
                >
                    <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-zinc-900 dark:text-white leading-snug">
                        {servicio.nombre}
                    </p>
                    <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                        ${Number(servicio.precio).toLocaleString("es-CO")}
                    </span>
                    </div>

                    {servicio.descripcion && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {servicio.descripcion}
                    </p>
                    )}

                    <div className="mt-auto pt-2 border-t border-zinc-50 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                    <Clock size={12} />
                    {servicio.duracion_minutos} min
                    </div>
                </div>
                ))}
            </div>
            </div>
        ))}
        </div>
    )}
    </div>

      {/* ── Portafolio ── */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
          Portafolio
        </h3>

        {portafolio.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-2">
            <ImageIcon size={20} className="text-zinc-300 dark:text-zinc-600" />
            Aún no has subido imágenes a tu portafolio.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {portafolio.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800"
              >
                <img
                  src={img.imagen}
                  alt={img.descripcion || "Imagen de portafolio"}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => pedirConfirmacionEliminar(img)}
                    className="w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

       {/* ── Modal del código QR ── */}
      <ModalCodigoQR abierto={qrAbierto} onClose={() => setQrAbierto(false)} />


      {/* ── Modal de confirmación para eliminar imagen ── */}
      {imagenAEliminar && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate__animated animate__fadeIn animate__faster"
            onClick={cancelarEliminar}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-sm overflow-hidden animate__animated animate__zoomIn animate__faster"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  Eliminar imagen
                </span>
                <button
                  onClick={cancelarEliminar}
                  disabled={eliminando}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contenido */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    <img
                      src={imagenAEliminar.imagen}
                      alt="Imagen a eliminar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    ¿Seguro que quieres eliminar esta imagen de tu portafolio? Esta acción no se puede deshacer.
                  </p>
                </div>

                {errorEliminar && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    {errorEliminar}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  onClick={cancelarEliminar}
                  disabled={eliminando}
                  className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminarImagen}
                  disabled={eliminando}
                  className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {eliminando && <Loader2 size={14} className="animate-spin" />}
                  {eliminando ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default MiCatalogoSection;