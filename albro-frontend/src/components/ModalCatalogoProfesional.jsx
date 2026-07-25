import { useState, useEffect } from "react";
import { X, Star, MapPin, Image as ImageIcon, Clock, CalendarClock } from "lucide-react";
import Portal from "@/components/ui/Portal";

const ModalCatalogoProfesional = ({
  profesional,        // { id, nombre, apellido, ... } — datos crudos del marker
  catalogo,            // respuesta de getCatalogoProfesional, o null mientras carga
  cargando,
  error,
  onClose,
  onAgendar,           // (profesional) => void
}) => {
  // ── Lightbox de imagen ampliada ──────────────────────────────────────
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  // Cierra el lightbox con Escape (y no el modal completo, si está abierto)
  useEffect(() => {
    if (!imagenAmpliada) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setImagenAmpliada(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [imagenAmpliada]);

  if (!profesional) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate__animated animate__fadeIn animate__faster"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate__animated animate__zoomIn animate__faster"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {catalogo?.profesional?.nombre_local || `${profesional.nombre} ${profesional.apellido}`}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contenido con scroll */}
          <div className="overflow-y-auto px-5 py-4">
            {cargando ? (
              <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                Cargando catálogo...
              </div>
            ) : error ? (
              <div className="py-12 text-center text-sm text-red-500">{error}</div>
            ) : catalogo ? (
              <div className="space-y-6">
                {/* Info del profesional */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {catalogo.profesional.foto_perfil ? (
                      <img
                        src={catalogo.profesional.foto_perfil}
                        alt={catalogo.profesional.nombre_local}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                        {catalogo.profesional.nombre_local?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    {catalogo.profesional.descripcion && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {catalogo.profesional.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      {catalogo.profesional.direccion && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {catalogo.profesional.direccion}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {catalogo.profesional.promedio_calificacion ?? "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Servicios — cards en grid, agrupadas por categoría */}
                {catalogo.categorias?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-3">
                      Servicios
                    </h4>
                    <div className="space-y-5">
                      {catalogo.categorias.map((categoria) => (
                        <div key={categoria.id ?? "sin-categoria"}>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                            {categoria.nombre}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {categoria.servicios.map((servicio) => (
                              <div
                                key={servicio.id}
                                className="group rounded-xl border border-zinc-100 dark:border-zinc-800 p-3.5 flex flex-col gap-2.5 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white leading-snug">
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
                  </div>
                )}

                {/* Portafolio */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
                    Portafolio
                  </h4>
                  {catalogo.portafolio?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {catalogo.portafolio.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setImagenAmpliada(img)}
                          className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-zoom-in group/img relative"
                        >
                          <img
                            src={img.imagen}
                            alt={img.descripcion || "Imagen de portafolio"}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-2">
                      <ImageIcon size={18} className="text-zinc-300 dark:text-zinc-600" />
                      Este profesional aún no tiene imágenes en su portafolio.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => onAgendar(profesional)}
              className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <CalendarClock size={14} />
              Agendar cita
            </button>
          </div>
        </div>
      </div>

      {/* ── Lightbox: imagen ampliada ── */}
      {imagenAmpliada && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 cursor-zoom-out animate__animated animate__fadeIn animate__faster"
          onClick={() => setImagenAmpliada(null)}
        >
          <button
            onClick={() => setImagenAmpliada(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>

          <img
            src={imagenAmpliada.imagen}
            alt={imagenAmpliada.descripcion || "Imagen de portafolio ampliada"}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg cursor-default animate__animated animate__zoomIn animate__faster"
          />

          {imagenAmpliada.descripcion && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full max-w-[90%] text-center"
            >
              {imagenAmpliada.descripcion}
            </div>
          )}
        </div>
      )}
    </Portal>
  );
};

export default ModalCatalogoProfesional;