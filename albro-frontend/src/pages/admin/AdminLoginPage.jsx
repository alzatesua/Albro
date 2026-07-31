import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuthAdmin } from "@/context/AuthContextAdmin";
import { solicitarCodigoAdmin, verificarCodigoAdmin } from "@/services/api";

import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [paso, setPaso] = useState(1); // 1 = credenciales, 2 = código OTP
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [codigoOtp, setCodigoOtp] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { guardarSesionAdmin } = useAuthAdmin();
  const navigate = useNavigate();

  // Partículas generadas una sola vez (posiciones/tamaños/duraciones aleatorias)
  const particulas = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duracion: Math.random() * 8 + 6,
      retraso: Math.random() * 6,
      opacidad: Math.random() * 0.5 + 0.15,
    }));
  }, []);

  const manejarSolicitarCodigo = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      await solicitarCodigoAdmin(username, password);
      setPaso(2);
    } catch (err) {
      setError(err.message || "Credenciales inválidas.");
    } finally {
      setCargando(false);
    }
  };

  const manejarVerificarCodigo = async (e) => {
    e.preventDefault();
    if (!codigoOtp) {
      setError("Ingresa el código que recibiste.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const data = await verificarCodigoAdmin(username, codigoOtp);
      guardarSesionAdmin(data);
      navigate("/gestion-x9k2/pagos-pendientes");
    } catch (err) {
      setError(err.message || "Código inválido o expirado.");
    } finally {
      setCargando(false);
    }
  };

  const volverAlPaso1 = () => {
    setPaso(1);
    setCodigoOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <style>{`
        @keyframes flotar {
          0%, 100% { transform: translateY(0); opacity: var(--op); }
          50% { transform: translateY(-16px); opacity: calc(var(--op) * 1.6); }
        }
      `}</style>

      {/* Glow radial sutil detrás de la card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Textura de grano */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Partículas blancas flotando */}
      <div className="absolute inset-0 pointer-events-none">
        {particulas.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              "--op": p.opacidad,
              opacity: p.opacidad,
              animation: `flotar ${p.duracion}s ease-in-out ${p.retraso}s infinite`,
              boxShadow: p.size > 1.7 ? "0 0 6px rgba(255,255,255,0.6)" : "none",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Encabezado */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mb-5"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0))",
              boxShadow: "0 0 30px rgba(255,255,255,0.08)",
            }}
          >
            <Lock size={18} className="text-white" strokeWidth={1.5} />
          </div>
          <p className="text-white font-bold text-sm tracking-[0.35em] uppercase">
            Albro
          </p>
          <p className="text-white/35 text-[11px] tracking-[0.25em] uppercase mt-1.5">
            Panel administrativo
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`h-[3px] rounded-full transition-all duration-500 ${
              paso === 1 ? "w-8 bg-white" : "w-4 bg-white/25"
            }`}
          />
          <div
            className={`h-[3px] rounded-full transition-all duration-500 ${
              paso === 2 ? "w-8 bg-white" : "w-4 bg-white/25"
            }`}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 backdrop-blur-sm"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="mb-7">
            {paso === 1 ? (
              <>
                <h2 className="text-xl font-semibold text-white">
                  Acceso de operador
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Ingresa tus credenciales para continuar
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-white" strokeWidth={1.5} />
                  <h2 className="text-xl font-semibold text-white">
                    Verificación
                  </h2>
                </div>
                <p className="text-white/40 text-sm mt-1">
                  Enviamos un código a tu correo registrado
                </p>
              </>
            )}
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="py-3 border border-white/20 bg-white/[0.03] rounded-xl mb-6"
            >
              <AlertDescription className="text-sm text-white/90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {paso === 1 ? (
            <form onSubmit={manejarSolicitarCodigo} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-white/50 text-xs tracking-wide uppercase">
                  Usuario
                </Label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="usuario.operador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={cargando}
                  autoComplete="username"
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.5)";
                    e.target.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.12)";
                    e.target.style.background = "rgba(255,255,255,0.04)";
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/50 text-xs tracking-wide uppercase">
                  Contraseña
                </Label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={cargando}
                  autoComplete="current-password"
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.5)";
                    e.target.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.12)";
                    e.target.style.background = "rgba(255,255,255,0.04)";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  color: "#0a0a0a",
                  boxShadow: "0 8px 24px rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando código...
                  </span>
                ) : (
                  "Enviar código"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={manejarVerificarCodigo} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="codigoOtp" className="text-white/50 text-xs tracking-wide uppercase">
                  Código de verificación
                </Label>
                <input
                  id="codigoOtp"
                  name="codigoOtp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={codigoOtp}
                  onChange={(e) => setCodigoOtp(e.target.value)}
                  disabled={cargando}
                  autoComplete="one-time-code"
                  autoFocus
                  className="w-full h-14 px-4 rounded-xl text-2xl text-white placeholder:text-white/15 outline-none transition-all text-center tracking-[0.5em]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.5)";
                    e.target.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.12)";
                    e.target.style.background = "rgba(255,255,255,0.04)";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  color: "#0a0a0a",
                  boxShadow: "0 8px 24px rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  "Ingresar"
                )}
              </button>

              <button
                type="button"
                onClick={volverAlPaso1}
                disabled={cargando}
                className="w-full h-9 text-sm font-medium text-white/45 hover:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft size={14} />
                Volver
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/25 text-[11px] mt-7 tracking-wide">
          Acceso restringido — solo personal autorizado
        </p>
      </div>
    </div>
  );
}