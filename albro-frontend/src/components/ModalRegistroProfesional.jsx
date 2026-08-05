import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Store,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Search,
  Briefcase,
} from "lucide-react";
import { getDepartamentos, getMunicipios, registrarProfesional } from "@/services/api";
import ModalUbicacionMapa from "../pages/dashboard/ModalUbicacionMapa";


// ─── Select con buscador ──────────────────────────────────────────────────────
function SelectBuscable({ id, value, onChange, disabled, options, placeholder, cargandoTexto, cargando }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);

  const seleccionado = options.find((op) => String(op.id) === String(value));

  const opcionesFiltradas = options.filter((op) =>
    op.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const manejarClicFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
        setBusqueda("");
      }
    };
    document.addEventListener("mousedown", manejarClicFuera);
    return () => document.removeEventListener("mousedown", manejarClicFuera);
  }, []);

  const abrir = () => {
    if (disabled || cargando) return;
    setAbierto(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const seleccionar = (opcion) => {
    onChange({ target: { name: id, value: String(opcion.id) } });
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        id={id}
        onClick={abrir}
        disabled={disabled || cargando}
        className="w-full flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800
                   px-3 py-2 text-sm text-left
                   focus:outline-none focus:ring-1 focus:ring-white focus:border-white
                   hover:border-zinc-500 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className={seleccionado ? "text-white" : "text-zinc-500"}>
          {cargando ? cargandoTexto : seleccionado ? seleccionado.nombre : placeholder}
        </span>
        <ChevronDown className="size-4 text-zinc-500 shrink-0" />
      </button>

      {abierto && !disabled && !cargando && (
        <div className="absolute z-20 mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-800 shadow-lg overflow-hidden">
          <div className="relative border-b border-zinc-700">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-transparent text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {opcionesFiltradas.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-zinc-500">Sin resultados</p>
            ) : (
              opcionesFiltradas.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => seleccionar(op)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    String(op.id) === String(value)
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-200 hover:bg-zinc-700/60"
                  }`}
                >
                  {op.nombre}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function ModalRegistroProfesional({ onCompleto }) {
  const [form, setForm] = useState({
    nombre_local: "",
    descripcion: "",
    direccion: "",
    departamento_id: "",
    municipio_id: "",
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [cargandoDeps, setCargandoDeps] = useState(true);
  const [cargandoMunis, setCargandoMunis] = useState(false);
  const [estado, setEstado] = useState({ cargando: false, error: null, exito: false });

  const [mostrarModalUbicacion, setMostrarModalUbicacion] = useState(false);
  const [coordsExactas, setCoordsExactas] = useState({ latitud: null, longitud: null });

  // Cargar departamentos al montar
  useEffect(() => {
    getDepartamentos()
      .then(setDepartamentos)
      .catch(() =>
        setEstado((p) => ({ ...p, error: "No se pudieron cargar los departamentos." }))
      )
      .finally(() => setCargandoDeps(false));
  }, []);

  // Cargar municipios al cambiar departamento
  useEffect(() => {
    if (!form.departamento_id) {
      setMunicipios([]);
      return;
    }
    setCargandoMunis(true);
    setForm((p) => ({ ...p, municipio_id: "" }));
    getMunicipios(form.departamento_id)
      .then(setMunicipios)
      .catch(() =>
        setEstado((p) => ({ ...p, error: "No se pudieron cargar los municipios." }))
      )
      .finally(() => setCargandoMunis(false));
  }, [form.departamento_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (estado.error) setEstado((p) => ({ ...p, error: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre_local.trim()) {
      setEstado((p) => ({ ...p, error: "El nombre del local es obligatorio." }));
      return;
    }
    if (!form.descripcion.trim()) {
      setEstado((p) => ({ ...p, error: "La descripción es obligatoria." }));
      return;
    }
    if (!form.departamento_id) {
      setEstado((p) => ({ ...p, error: "Selecciona un departamento." }));
      return;
    }
    if (!form.municipio_id) {
      setEstado((p) => ({ ...p, error: "Selecciona un municipio." }));
      return;
    }
    if (!coordsExactas.latitud || !coordsExactas.longitud) {
      setEstado((p) => ({
        ...p,
        error: "Debes fijar tu ubicación en el mapa antes de guardar.",
      }));
      return;
    }
    setEstado({ cargando: true, error: null, exito: false });
    try {
      await registrarProfesional({
        nombre_local: form.nombre_local,
        descripcion: form.descripcion,
        direccion: form.direccion,
        departamento_id: Number(form.departamento_id),
        municipio_id: Number(form.municipio_id),
        latitud: coordsExactas.latitud,
        longitud: coordsExactas.longitud,
      });

      setEstado({ cargando: false, error: null, exito: true });

      // Avisa al padre (DashboardPage) que el perfil se guardó con éxito.
      // El padre decide qué hacer (cerrar sesión, redirigir, etc.)
      setTimeout(() => {
        onCompleto?.();
      }, 1200);
    } catch (err) {
      setEstado({
        cargando: false,
        error: err.message || "No se pudo conectar con el servidor.",
        exito: false,
      });
    }
  };

  const { cargando, error, exito } = estado;

  return (
    /* Backdrop — pointer-events-none en el fondo para que no se pueda cerrar haciendo clic fuera */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900
                      shadow-2xl shadow-black/60 overflow-hidden"
        // Evita que el clic dentro del modal propague al backdrop
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="border-b border-zinc-800 px-8 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
              <Briefcase className="size-4 text-zinc-300" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">Completa tu perfil profesional</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Necesitamos estos datos para activar tu cuenta
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo con scroll por si la pantalla es pequeña */}
        <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
          <form id="form-profesional" onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre del local */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre_local" className="text-sm text-zinc-300">
                Nombre del local
              </Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4 pointer-events-none" />
                <Input
                  id="nombre_local"
                  name="nombre_local"
                  type="text"
                  placeholder="Barbería JP"
                  value={form.nombre_local}
                  onChange={handleChange}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600
                             focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                             hover:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-sm text-zinc-300">
                Descripción
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-zinc-500 size-4 pointer-events-none" />
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={3}
                  placeholder="Especialista en cortes, barba y color…"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2
                             text-sm text-white placeholder:text-zinc-600 resize-none
                             focus:outline-none focus:ring-1 focus:ring-white focus:border-white
                             hover:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <Label htmlFor="departamento_id" className="text-sm text-zinc-300">
                Departamento
              </Label>
              {cargandoDeps ? (
                <div className="flex items-center gap-2 text-sm text-zinc-500 py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando departamentos…
                </div>
              ) : (
                <SelectBuscable
                  id="departamento_id"
                  value={form.departamento_id}
                  onChange={handleChange}
                  options={departamentos}
                  placeholder="Selecciona un departamento"
                />
              )}
            </div>

            {/* Municipio */}
            <div className="space-y-1.5">
              <Label htmlFor="municipio_id" className="text-sm text-zinc-300">
                Municipio
              </Label>
              <SelectBuscable
                id="municipio_id"
                value={form.municipio_id}
                onChange={handleChange}
                disabled={!form.departamento_id}
                cargando={cargandoMunis}
                cargandoTexto="Cargando municipios…"
                options={municipios}
                placeholder={
                  form.departamento_id
                    ? "Selecciona un municipio"
                    : "Primero selecciona un departamento"
                }
              />
            </div>

            {/* Dirección */}
            <div className="space-y-1.5">
              <Label htmlFor="direccion" className="text-sm text-zinc-300">
                Dirección
              </Label>
               <button
                type="button"
                onClick={() => setMostrarModalUbicacion(true)}
                className={`group w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-md border text-sm transition-colors ${
                  form.direccion
                    ? "bg-zinc-800 border-zinc-700 hover:border-emerald-500/60 hover:bg-emerald-950/10"
                    : "border-dashed border-emerald-500/40 bg-emerald-950/10 hover:bg-emerald-950/20 hover:border-emerald-500/60"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      form.direccion
                        ? "bg-zinc-700 text-zinc-400 group-hover:bg-emerald-500/15 group-hover:text-emerald-400"
                        : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    <MapPin size={14} />
                  </span>
                  <span
                    className={`truncate ${
                      form.direccion ? "text-zinc-100" : "text-emerald-400 font-medium"
                    }`}
                  >
                    {form.direccion || "Fijar ubicación en el mapa"}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                    form.direccion
                      ? "text-zinc-400 bg-zinc-700 group-hover:bg-emerald-500/15 group-hover:text-emerald-400"
                      : "text-white bg-emerald-500 group-hover:bg-emerald-600"
                  }`}
                >
                  {form.direccion ? "Cambiar" : "Abrir mapa"}
                </span>
              </button>
            </div>

            {/* Feedback */}
            {error && (
              <Alert className="border-red-900 bg-red-950/50 text-red-300 py-3">
                <AlertCircle className="size-4 text-red-400" />
                <AlertDescription className="text-sm ml-2">{error}</AlertDescription>
              </Alert>
            )}

            {exito && (
              <Alert className="border-emerald-900 bg-emerald-950/50 text-emerald-300 py-3">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <AlertDescription className="text-sm ml-2">
                  ¡Perfil creado! Activando tu cuenta…
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>

        {/* Footer con botón fuera del scroll */}
        <div className="border-t border-zinc-800 px-8 py-5">
          <Button
            type="submit"
            form="form-profesional"
            disabled={cargando || exito || cargandoDeps}
            className="w-full bg-white text-zinc-950 hover:bg-zinc-100 active:bg-zinc-200
                       font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            {cargando ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Guardando perfil…
              </span>
            ) : (
              "Guardar perfil"
            )}
          </Button>
        </div>
      </div>

     {mostrarModalUbicacion && (
        <ModalUbicacionMapa
          latInicial={coordsExactas.latitud}
          lngInicial={coordsExactas.longitud}
          onCerrar={() => setMostrarModalUbicacion(false)}
          onConfirmar={({ latitud, longitud, direccion }) => {
            setCoordsExactas({ latitud, longitud });
            setForm((p) => ({ ...p, direccion }));
            setMostrarModalUbicacion(false);
          }}
        />
      )}
    </div>
  );
}