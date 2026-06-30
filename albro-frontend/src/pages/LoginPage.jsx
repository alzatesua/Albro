import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { loginUsuario } from "@/services/api";
import fondoLogin from "@/assets/fondo-login.jpeg";
import imagenDerecha from "@/assets/imege-derecha-login.jpg";

import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Sun, Moon } from "lucide-react";

import { useGoogleLogin } from '@react-oauth/google'
import { loginConGoogle } from '../services/authService'

const LoginPage = () => {
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();
  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (response) => {
      try {
        const data = await loginConGoogle(response.code) // solo el code
        guardarSesion(data)
        navigate('/dashboard')
      } catch (err) {
        if (err.status === 404) {
          navigate('/registrarme')
        } else {
          setError(err.message || 'Error con Google')
        }
      }
    },
    onError: () => setError('Error al conectar con Google'),
  })
  const [form, setForm] = useState({ email: "", password: "" });
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const datos = await loginUsuario(form.email, form.password);
      guardarSesion(datos);

      const card = document.getElementById("login-card");
      card.classList.add("animate__zoomOut");

      card.addEventListener("animationend", () => {
        navigate("/dashboard");
      }, { once: true });

    } catch (err) {
      setError(err.message || "Credenciales incorrectas. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
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
      {/* Overlay general oscuro */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Botón modo oscuro */}
      <button
        onClick={() => setDark(!dark)}
        className="absolute top-5 right-5 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "white",
        }}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Contenedor centrado */}
      <div
        id="login-container"
        className="relative z-10 w-full flex items-center justify-center p-6 overflow-hidden"
      >
        {/* Card principal */}
        <div
          id="login-card"
          className="animate__animated animate__fadeInRight animate__fast w-full max-w-4xl rounded-3xl overflow-hidden isolate flex items-stretch"
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

            <div className="mb-8">
              {/* Nombre Albro centrado */}
              <div className="mb-6 text-center">
                <p className="text-white font-bold text-2xl tracking-widest uppercase">
                  Albro
                </p>
              </div>

              <h2 className="text-3xl font-bold text-white tracking-tight">
                Bienvenido!
              </h2>
              <p className="text-white/50 text-sm mt-1">
                Ingresa a tu cuenta para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert
                  variant="destructive"
                  className="py-3 border-red-500/40"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <AlertDescription className="text-sm text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70 text-sm font-medium">
                  Correo electrónico
                </Label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={cargando}
                  autoComplete="email"
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.45)";
                    e.target.style.background = "rgba(255,255,255,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.15)";
                    e.target.style.background = "rgba(255,255,255,0.1)";
                  }}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/70 text-sm font-medium">
                    Contraseña
                  </Label>
                  <a
                    href="#"
                    className="text-xs text-white/40 hover:text-white/80 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={verPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    disabled={cargando}
                    autoComplete="current-password"
                    className="w-full h-11 px-4 pr-11 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                    onFocus={(e) => {
                      e.target.style.border = "1px solid rgba(255,255,255,0.45)";
                      e.target.style.background = "rgba(255,255,255,0.15)";
                    }}
                    onBlur={(e) => {
                      e.target.style.border = "1px solid rgba(255,255,255,0.15)";
                      e.target.style.background = "rgba(255,255,255,0.1)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    tabIndex={-1}
                  >
                    {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Botón principal */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  color: "#111",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.95)")
                }
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ingresando...
                  </span>
                ) : (
                  "Ingresar"
                )}
              </button>

              {/* Separador */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
                <span className="text-xs text-white/30">o continúa con</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>

              {/* Google login */}
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                className="w-full h-11 rounded-xl text-sm font-medium text-white/70 hover:text-white flex items-center justify-center gap-3 transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.border = "1px solid rgba(255,255,255,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.5 39.5 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                Continuar con Google
              </button>
            </form>

            {/* Link a registro */}
            <p className="mt-8 text-center text-xs text-white/30">
              ¿No tienes cuenta?{" "}
              <Link
                to="/registrarme"
                className="text-white/70 font-medium hover:text-white transition-colors"
              >
                Regístrate aquí
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
              filter: "grayscale(100%)",
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 space-y-2">
              <h3 className="text-white text-2xl font-bold leading-snug">
                Gestiona tus citas mas rapido y desde un solo lugar
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;