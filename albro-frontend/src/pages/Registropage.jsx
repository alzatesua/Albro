import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { registrarUsuario } from "@/services/api";
import fondoLogin from "@/assets/fondo-login.jpeg";
import imagenDerecha from "@/assets/imege-derecha-login.jpg";

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
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setEstado({
        cargando: false,
        error: err.message || "No se pudo conectar con el servidor.",
        exito: false,
      });
    }
  };

  const { cargando, error, exito } = estado;

  const inputStyle = {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
  };

  const inputFocus = (e) => {
    e.target.style.border = "1px solid rgba(255,255,255,0.45)";
    e.target.style.background = "rgba(255,255,255,0.15)";
  };

  const inputBlur = (e) => {
    e.target.style.border = "1px solid rgba(255,255,255,0.15)";
    e.target.style.background = "rgba(255,255,255,0.1)";
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{
        backgroundImage: `url(${fondoLogin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Contenedor centrado */}
      <div className="relative z-10 w-full flex items-center justify-center p-6 overflow-hidden">
        <div
          className="animate__animated animate__fadeInRight animate__fast w-full max-w-4xl rounded-3xl overflow-hidden flex"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
          }}
        >
          {/* Panel izquierdo — formulario */}
          <div className="w-full lg:w-1/2 p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Crea tu cuenta
              </h2>
              <p className="text-white/50 text-sm mt-1">
                Únete y empieza a gestionar tu negocio
              </p>
            </div>

            {/* Selector de rol */}
            <div className="mb-5">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                Quiero unirme como
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["cliente", "profesional"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, rol: r }))}
                    className="h-10 rounded-xl text-sm font-medium transition-all"
                    style={
                      form.rol === r
                        ? { background: "rgba(255,255,255,0.95)", color: "#111" }
                        : {
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.5)",
                          }
                    }
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-white/70 text-sm font-medium">Nombre</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      id="nombre" name="nombre" type="text"
                      placeholder="Juan"
                      value={form.nombre} onChange={handleChange} required
                      className="w-full h-11 pl-9 pr-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                      style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/70 text-sm font-medium">Apellido</label>
                  <input
                    id="apellido" name="apellido" type="text"
                    placeholder="Alzate"
                    value={form.apellido} onChange={handleChange} required
                    className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium">Correo electrónico</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="email" name="email" type="email"
                    placeholder="juan@ejemplo.com"
                    value={form.email} onChange={handleChange} required
                    className="w-full h-11 pl-9 pr-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="password" name="password" type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={form.password} onChange={handleChange} required
                    className="w-full h-11 pl-9 pr-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium">Teléfono</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="telefono" name="telefono" type="tel"
                    placeholder="+57 300 123 4567"
                    value={form.telefono} onChange={handleChange} required
                    className="w-full h-11 pl-9 pr-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Feedback */}
              {error && (
                <Alert className="py-3 border-red-500/40"
                  style={{ background: "rgba(239,68,68,0.15)", backdropFilter: "blur(8px)" }}>
                  <AlertCircle className="size-4 text-red-400" />
                  <AlertDescription className="text-sm text-red-200 ml-2">{error}</AlertDescription>
                </Alert>
              )}

              {exito && (
                <Alert className="py-3 border-emerald-500/40"
                  style={{ background: "rgba(16,185,129,0.15)", backdropFilter: "blur(8px)" }}>
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <AlertDescription className="text-sm text-emerald-200 ml-2">
                    Cuenta creada. Redirigiendo al login…
                  </AlertDescription>
                </Alert>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={cargando || exito}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.95)", color: "#111" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando cuenta…
                  </span>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-white/30">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-white/70 font-medium hover:text-white transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Panel derecho — imagen */}
          <div
            className="hidden lg:flex lg:w-1/2 flex-col justify-end p-10 relative overflow-hidden"
            style={{
              backgroundImage: `url(${imagenDerecha})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderLeft: "1px solid rgba(255,255,255,0.1)",
              filter: "grayscale(100%)",
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 space-y-2">
              <p className="text-white/50 text-xs uppercase tracking-widest font-medium">
                Plataforma profesional
              </p>
              <h3 className="text-white text-2xl font-bold leading-snug">
                Gestiona tus citas y clientes desde un solo lugar
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}