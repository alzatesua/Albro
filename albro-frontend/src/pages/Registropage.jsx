import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { registrarUsuario } from "@/services/api";

export default function RegistroPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    telefono: "",
    rol: "cliente",
  });

  const [estado, setEstado] = useState({ cargando: false, error: null, exito: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (estado.error) setEstado((prev) => ({ ...prev, error: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado({ cargando: true, error: null, exito: false });

    try {
      await registrarUsuario(form);
      setEstado({ cargando: false, error: null, exito: true });
      // Redirige al login tras 1.5 s para que el usuario vea el mensaje de éxito
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setEstado({
        cargando: false,
        error: err.message || "No se pudo conectar con el servidor. Inténtalo de nuevo.",
        exito: false,
      });
    }
  };

  const { cargando, error, exito } = estado;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      {/* Card contenedor */}
      <div className="w-full max-w-md">
        {/* Logo / nombre */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Albro</h1>
          <p className="mt-1 text-sm text-zinc-400">Crea tu cuenta y empieza hoy</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/40">
          {/* Selector de rol */}
          <div className="mb-6">
            <Label className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-2 block">
              Quiero unirme como
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {["cliente", "profesional"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, rol: r }))}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer
                    ${
                      form.rol === r
                        ? "border-white bg-white text-zinc-950"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-sm text-zinc-300">
                  Nombre
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4 pointer-events-none" />
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Juan"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                    className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600
                               focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                               hover:border-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apellido" className="text-sm text-zinc-300">
                  Apellido
                </Label>
                <Input
                  id="apellido"
                  name="apellido"
                  type="text"
                  placeholder="Alzate"
                  value={form.apellido}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600
                             focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                             hover:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-zinc-300">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4 pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600
                             focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                             hover:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-zinc-300">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600
                             focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                             hover:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="telefono" className="text-sm text-zinc-300">
                Teléfono
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 size-4 pointer-events-none" />
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={form.telefono}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600
                             focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                             hover:border-zinc-500 transition-colors"
                />
              </div>
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
                  Cuenta creada. Redirigiendo al login…
                </AlertDescription>
              </Alert>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={cargando || exito}
              className="w-full bg-white text-zinc-950 hover:bg-zinc-100 active:bg-zinc-200
                         font-medium transition-colors mt-2 cursor-pointer disabled:opacity-60"
            >
              {cargando ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Creando cuenta…
                </span>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>

          {/* Link a login */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="text-zinc-300 underline underline-offset-4 hover:text-white transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}