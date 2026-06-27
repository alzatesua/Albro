import { useState, useEffect } from "react";
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
  Briefcase,
} from "lucide-react";
import { getDepartamentos, getMunicipios, registrarProfesional } from "@/services/api";

// ─── Select estilizado ────────────────────────────────────────────────────────
function Select({ id, name, value, onChange, disabled, children, placeholder }) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
        className="w-full appearance-none rounded-md border border-zinc-700 bg-zinc-800
                   px-3 py-2 text-sm text-white
                   focus:outline-none focus:ring-1 focus:ring-white focus:border-white
                   hover:border-zinc-500 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
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
    setEstado({ cargando: true, error: null, exito: false });
    try {
      await registrarProfesional({
        nombre_local: form.nombre_local,
        descripcion: form.descripcion,
        direccion: form.direccion,
        departamento_id: Number(form.departamento_id),
        municipio_id: Number(form.municipio_id),
      });
      setEstado({ cargando: false, error: null, exito: true });
      // Pequeño delay para que el usuario vea el check antes de cerrar
      setTimeout(() => onCompleto(), 1200);
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
                  required
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
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2
                             text-sm text-white placeholder:text-zinc-600 resize-none
                             focus:outline-none focus:ring-1 focus:ring-white focus:border-white
                             hover:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-1.5">
              <Label htmlFor="direccion" className="text-sm text-zinc-300">
                Dirección
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4 pointer-events-none" />
                <Input
                  id="direccion"
                  name="direccion"
                  type="text"
                  placeholder="Carrera 8 #18-55"
                  value={form.direccion}
                  onChange={handleChange}
                  required
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600
                             focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
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
                <Select
                  id="departamento_id"
                  name="departamento_id"
                  value={form.departamento_id}
                  onChange={handleChange}
                  placeholder="Selecciona un departamento"
                >
                  {departamentos.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.nombre}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Municipio */}
            <div className="space-y-1.5">
              <Label htmlFor="municipio_id" className="text-sm text-zinc-300">
                Municipio
              </Label>
              {cargandoMunis ? (
                <div className="flex items-center gap-2 text-sm text-zinc-500 py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando municipios…
                </div>
              ) : (
                <Select
                  id="municipio_id"
                  name="municipio_id"
                  value={form.municipio_id}
                  onChange={handleChange}
                  disabled={!form.departamento_id}
                  placeholder={
                    form.departamento_id
                      ? "Selecciona un municipio"
                      : "Primero selecciona un departamento"
                  }
                >
                  {municipios.map((mun) => (
                    <option key={mun.id} value={mun.id}>
                      {mun.nombre}
                    </option>
                  ))}
                </Select>
              )}
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
    </div>
  );
}