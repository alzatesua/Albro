import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Toast from "./Toast";
import { actualizarImagenPerfil, getPerfilProfesional, actualizarDatosPersonales, getMisServicios, eliminarServicio } from "@/services/api";
import {
  Camera, Phone, Scissors, FileText, MapPin, Store,
  CalendarCheck, Clock, Plus, Trash2, DollarSign, User, X
} from "lucide-react";

const TABS = [
  { key: "personal", label: "Datos personales", icono: User },
  { key: "servicios", label: "Servicios", icono: Scissors },
  { key: "horarios", label: "Horarios", icono: Clock },
  { key: "disponibilidad", label: "Disponibilidad", icono: CalendarCheck },
];

const DIAS_SEMANA = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];
// Formatea precios en pesos colombianos, ej: 25000 -> $25.000
const formatearPrecio = (valor) => {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numero);
};

// Horarios "por defecto" para los días que aún no tiene el profesional.
// Se usan solo como plantilla al activar un día nuevo.
const HORARIOS_BASE = {
  lunes:     { activo: false, inicio: "08:00", fin: "17:00" },
  martes:    { activo: false, inicio: "08:00", fin: "17:00" },
  miercoles: { activo: false, inicio: "08:00", fin: "17:00" },
  jueves:    { activo: false, inicio: "08:00", fin: "17:00" },
  viernes:   { activo: false, inicio: "08:00", fin: "17:00" },
  sabado:    { activo: false, inicio: "08:00", fin: "17:00" },
  domingo:   { activo: false, inicio: "08:00", fin: "17:00" },
};

// El backend guarda imagen_perfil como ruta relativa ("/media/..."),
// así que hay que anteponerle el host del backend (sin el "/api" final).
const getMediaUrl = (ruta) => {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = import.meta.env.VITE_API_URL || "http://localhost:8006/api";
  const host = base.replace(/\/api\/?$/, "");
  return `${host}${ruta}`;
};

// Convierte el array horarios_atencion de la API en el objeto que usa el estado local
const mapearHorariosDesdeApi = (horariosAtencion = []) => {
  const nuevo = { ...HORARIOS_BASE };
  horariosAtencion.forEach(({ dia, inicio, fin }) => {
    if (nuevo[dia]) {
      nuevo[dia] = { activo: true, inicio, fin };
    }
  });
  return nuevo;
};

const Campo = ({ icono: Icono, label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
      <Icono size={13} />
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors";

const PerfilSection = () => {
  const { usuario } = useAuth();
  const [tabActiva, setTabActiva] = useState("personal");

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    especialidad: "",   // nombre_local
    bio: "",            // descripcion
    direccion: "",
    ubicacion: "",
  });

  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);
  const [errorServicios, setErrorServicios] = useState(null);

  const [horarios, setHorarios] = useState(HORARIOS_BASE);
  const [agregandoHorario, setAgregandoHorario] = useState(false);

  const diasActivosLista = DIAS_SEMANA.filter(({ key }) => horarios[key].activo);
  const diasInactivos = DIAS_SEMANA.filter(({ key }) => !horarios[key].activo);

  const activarDiaHorario = (dia) => {
    setHorarios((h) => ({ ...h, [dia]: { ...h[dia], activo: true } }));
    setAgregandoHorario(false);
  };

  const desactivarDiaHorario = (dia) =>
    setHorarios((h) => ({ ...h, [dia]: { ...h[dia], activo: false } }));

  const [disponible, setDisponible] = useState(true);
  const [toast, setToast] = useState(null); // { mensaje, tipo, key }
  const toastTimeoutRef = useRef(null);

  const mostrarToast = (mensaje, tipo = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ mensaje, tipo, key: Date.now() });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const cerrarToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  };

  const [imagenPerfil, setImagenPerfil] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState(null);
  const inputFileRef = useRef(null);

  // ── Cargar (o recargar) datos del profesional desde la API ──
  // mostrarCargando=false se usa cuando refrescamos después de guardar,
  // para no volver a mostrar la pantalla completa de "Cargando..."
  const cargarPerfil = useCallback(async ({ mostrarCargando = true } = {}) => {
    if (mostrarCargando) setCargando(true);
    setErrorCarga(null);
    try {
      const data = await getPerfilProfesional();

      setForm({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        email: data.email || "",
        telefono: data.telefono || "",
        especialidad: data.nombre_local || "",
        bio: data.descripcion || "",
        direccion: data.direccion || "",
        ubicacion: data.ubicacion || "",
      });

      setHorarios(mapearHorariosDesdeApi(data.horarios_atencion));
      setImagenPerfil(getMediaUrl(data.imagen_perfil));
      setDisponible(data.estado?.codigo === "disponible");
      return data;
    } catch (err) {
      console.error("Error cargando perfil profesional:", err);
      setErrorCarga(err.message || "No se pudo cargar tu perfil");
      throw err;
    } finally {
      if (mostrarCargando) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const cargarServicios = useCallback(async () => {
    setCargandoServicios(true);
    setErrorServicios(null);
    try {
      const data = await getMisServicios();
      setServicios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando servicios:", err);
      setErrorServicios(err.message || "No se pudieron cargar tus servicios");
    } finally {
      setCargandoServicios(false);
    }
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const [eliminandoServicioId, setEliminandoServicioId] = useState(null);

  const manejarEliminarServicio = async (serv) => {
    const confirmado = window.confirm(
      `¿Seguro que quieres quitar "${serv.servicio_nombre}" de tus servicios?`
    );
    if (!confirmado) return;

    setEliminandoServicioId(serv.id);
    try {
      await eliminarServicio(serv.servicio_id);
      setServicios((actuales) => actuales.filter((s) => s.id !== serv.id));
      mostrarToast("Servicio eliminado correctamente");
    } catch (err) {
      console.error("Error eliminando servicio:", err);
      mostrarToast(err.message || "No se pudo eliminar el servicio", "error");
    } finally {
      setEliminandoServicioId(null);
    }
  };

  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const actualizarHorario = (dia, campo, valor) =>
    setHorarios((h) => ({ ...h, [dia]: { ...h[dia], [campo]: valor } }));

  // Arma el payload solo con los días activos, en el formato que espera la API
  const construirPayloadHorarios = () => ({
    horarios: Object.entries(horarios)
      .filter(([, v]) => v.activo)
      .map(([dia, v]) => ({ dia, inicio: v.inicio, fin: v.fin })),
  });

  const [guardando, setGuardando] = useState(false);

  const construirPayloadDatosPersonales = () => ({
    nombre: form.nombre,
    apellido: form.apellido,
    email: form.email,
    telefono: form.telefono,
    direccion: form.direccion,
    ubicacion: form.ubicacion,
    nombre_local: form.especialidad,
    descripcion: form.bio,
  });

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarDatosPersonales(construirPayloadDatosPersonales());

      // TODO: cuando tengas el endpoint de horarios, descomenta y ajusta:
      // const payloadHorarios = construirPayloadHorarios();
      // await request("/profesionales/horarios/", {
      //   method: "PUT",
      //   body: JSON.stringify(payloadHorarios),
      // });

      // Después de guardar, volvemos a consultar la API para
      // mostrar exactamente lo que quedó persistido en el backend.
      await cargarPerfil({ mostrarCargando: false });

      mostrarToast("Tus cambios se guardaron correctamente");
    } catch (err) {
      console.error("Error guardando cambios:", err);
      mostrarToast(err.message || "No se pudieron guardar los cambios", "error");
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = `${form.nombre?.[0] || ""}${form.apellido?.[0] || ""}`.toUpperCase();
  const serviciosOrdenados = [...servicios].sort((a, b) =>
    a.servicio_nombre.localeCompare(b.servicio_nombre, "es", { sensitivity: "base" })
  );

  const abrirSelectorImagen = () => inputFileRef.current?.click();

  const manejarCambioImagen = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setErrorImagen(null);

    // Preview inmediato mientras sube
    const previewUrl = URL.createObjectURL(archivo);
    const imagenAnterior = imagenPerfil;
    setImagenPerfil(previewUrl);
    setSubiendoImagen(true);

    try {
      const data = await actualizarImagenPerfil(archivo);
      setImagenPerfil(getMediaUrl(data.imagen_perfil)); // reemplaza el preview local por la URL real del backend
      // Refresca el resto del perfil por si el backend recalculó algo más
      await cargarPerfil({ mostrarCargando: false });
    } catch (err) {
      console.error("Error subiendo imagen de perfil:", err);
      setErrorImagen(err.message || "No se pudo actualizar la imagen");
      setImagenPerfil(imagenAnterior); // revierte al estado previo si falla
    } finally {
      setSubiendoImagen(false);
      e.target.value = ""; // permite volver a elegir el mismo archivo si quiere
    }
  };

  if (cargando) {
    return (
      <>
        <Toast toast={toast} onClose={cerrarToast} />
        <div className="flex items-center justify-center py-24 text-sm text-zinc-400 dark:text-zinc-500">
          Cargando tu perfil...
        </div>
      </>
    );
  }

  return (
    <>
      <Toast toast={toast} onClose={cerrarToast} />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10 items-start">
      {errorCarga && (
        <div className="lg:col-span-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
          {errorCarga}
        </div>
      )}

      {/* ── Columna izquierda: tarjeta de perfil ── */}
      <div className="lg:sticky lg:top-24 flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-500">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 text-2xl font-semibold shadow-md overflow-hidden">
            {imagenPerfil ? (
              <img
                src={imagenPerfil}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              iniciales || <Scissors size={28} />
            )}
            {subiendoImagen && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs">Subiendo...</span>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={inputFileRef}
            onChange={manejarCambioImagen}
            className="hidden"
          />

          <button
            type="button"
            onClick={abrirSelectorImagen}
            disabled={subiendoImagen}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
            aria-label="Cambiar foto de perfil"
          >
            <Camera size={13} />
          </button>
        </div>

        {errorImagen && (
          <p className="text-xs text-red-500 dark:text-red-400">{errorImagen}</p>
        )}

        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white leading-tight">
            {form.nombre || "Tu nombre"} {form.apellido}
          </h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            {form.especialidad || "Agrega el nombre de tu negocio"}
          </p>
          {form.ubicacion && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 flex items-center justify-center gap-1">
              <MapPin size={12} /> {form.ubicacion}
            </p>
          )}
        </div>

        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
            disponible
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              disponible ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
            }`}
          />
          {disponible ? "Disponible" : "No disponible"}
        </div>
      </div>

      {/* ── Columna derecha: pestañas + contenido ── */}
      <div className="min-w-0 lg:max-w-xl">
        {/* Barra de pestañas */}
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 mb-8">
          {TABS.map(({ key, label, icono: Icono }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTabActiva(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tabActiva === key
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icono size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Datos personales */}
        {tabActiva === "personal" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo icono={FileText} label="Nombre">
                <input
                  className={inputCls}
                  value={form.nombre}
                  onChange={(e) => actualizar("nombre", e.target.value)}
                  placeholder="Tu nombre"
                />
              </Campo>
              <Campo icono={FileText} label="Apellido">
                <input
                  className={inputCls}
                  value={form.apellido}
                  onChange={(e) => actualizar("apellido", e.target.value)}
                  placeholder="Tu apellido"
                />
              </Campo>
              <Campo icono={Phone} label="Teléfono">
                <input
                  className={inputCls}
                  value={form.telefono}
                  onChange={(e) => actualizar("telefono", e.target.value)}
                  placeholder="300 123 4567"
                />
              </Campo>
              <Campo icono={FileText} label="Correo">
                <input
                  className={`${inputCls} opacity-60 cursor-not-allowed`}
                  value={form.email}
                  disabled
                  readOnly
                />
              </Campo>
              <Campo icono={Store} label="Nombre del negocio">
                <input
                  className={inputCls}
                  value={form.especialidad}
                  onChange={(e) => actualizar("especialidad", e.target.value)}
                  placeholder="Ej. Barber Shop"
                />
              </Campo>
              <Campo icono={MapPin} label="Dirección">
                <input
                  className={inputCls}
                  value={form.direccion}
                  onChange={(e) => actualizar("direccion", e.target.value)}
                  placeholder="Cra 6 26-74"
                />
              </Campo>
              <Campo icono={MapPin} label="Ubicación">
                <input
                  className={inputCls}
                  value={form.ubicacion}
                  onChange={(e) => actualizar("ubicacion", e.target.value)}
                  placeholder="Municipio, Departamento"
                />
              </Campo>
            </div>
            <Campo icono={FileText} label="Sobre ti">
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={form.bio}
                onChange={(e) => actualizar("bio", e.target.value)}
                placeholder="Cuéntale a tus clientes sobre tu experiencia y estilo de trabajo"
              />
            </Campo>
          </div>
        )}

        {/* Servicios */}
        {tabActiva === "servicios" && (
          <div className="space-y-4">
            {cargandoServicios && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6">
                Cargando tus servicios...
              </p>
            )}

            {!cargandoServicios && errorServicios && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
                {errorServicios}
              </div>
            )}

            {!cargandoServicios && !errorServicios && serviciosOrdenados.length === 0 && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                Aún no tienes servicios registrados
              </p>
            )}

            {!cargandoServicios && !errorServicios && serviciosOrdenados.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviciosOrdenados.map((serv) => {
                  const eliminando = eliminandoServicioId === serv.id;
                  return (
                  <div
                    key={serv.id}
                    className="group relative flex flex-col gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => manejarEliminarServicio(serv)}
                      disabled={eliminando}
                     
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-100 disabled:cursor-not-allowed"
                      aria-label={`Quitar ${serv.servicio_nombre}`}
                      title="Quitar servicio"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="flex items-start justify-between gap-2 pr-6">
                      <div className="flex items-center gap-2.5">
                        <span className="shrink-0 w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
                          <Scissors size={15} />
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
                          {serv.servicio_nombre}
                        </h4>
                      </div>

                      <span
                        className={`shrink-0 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                          serv.activo
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            serv.activo ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                          }`}
                        />
                        {serv.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/70 dark:border-zinc-700/70">
                      <div className="flex items-center gap-1.5 flex-1 pt-2.5">
                        <DollarSign size={13} className="text-zinc-400 dark:text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {formatearPrecio(serv.precio)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 pt-2.5">
                        <Clock size={13} className="text-zinc-400 dark:text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {serv.duracion_minutos} min
                        </span>
                      </div>
                    </div>

                    {eliminando && (
                      <div className="absolute inset-0 rounded-2xl bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                        Eliminando...
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Horarios de atención */}
        {tabActiva === "horarios" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Días activos
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAgregandoHorario((v) => !v)}
                  disabled={diasInactivos.length === 0}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={13} /> Agregar horario
                </button>

                {agregandoHorario && diasInactivos.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 z-10 w-40 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg">
                    {diasInactivos.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => activarDiaHorario(key)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {diasActivosLista.length === 0 && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                Aún no has agregado horarios
              </p>
            )}

            <div className="space-y-3">
              {diasActivosLista.map(({ key, label }) => {
                const h = horarios[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                  >
                    <span className="w-24 shrink-0 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {label}
                    </span>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <input
                        type="time"
                        className={inputCls}
                        value={h.inicio}
                        onChange={(e) => actualizarHorario(key, "inicio", e.target.value)}
                      />
                      <span className="text-zinc-400 text-sm">–</span>
                      <input
                        type="time"
                        className={inputCls}
                        value={h.fin}
                        onChange={(e) => actualizarHorario(key, "fin", e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => desactivarDiaHorario(key)}
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      aria-label={`Quitar ${label}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Disponibilidad */}
        {tabActiva === "disponibilidad" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2.5">
                <CalendarCheck size={16} className="text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Disponible para nuevas citas
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Los clientes podrán agendar contigo mientras esté activo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisponible((v) => !v)}
                className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
                  disponible ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                aria-pressed={disponible}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-transform ${
                    disponible ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Guardar */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            onClick={guardar}
            disabled={guardando}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default PerfilSection;