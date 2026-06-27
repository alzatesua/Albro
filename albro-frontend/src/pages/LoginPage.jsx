import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { loginUsuario } from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Scissors, Sun, Moon } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    else { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  }, [dark]);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Por favor completa todos los campos."); return; }
    setCargando(true); setError("");
    try {
      const datos = await loginUsuario(form.email, form.password);
      guardarSesion(datos);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Credenciales incorrectas. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 dark:bg-zinc-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-zinc-800 dark:bg-zinc-900 opacity-60" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-zinc-800 dark:bg-zinc-900 opacity-40" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <Scissors size={18} className="text-zinc-900" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Albro</span>
          </div>
          <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-xl bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-white text-4xl font-bold leading-snug">
            Tu plataforma de<br />
            <span className="text-zinc-400">profesionales</span><br />
            de belleza
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
            Gestiona citas, servicios y clientes desde un solo lugar.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[{ valor: "1,200+", label: "Profesionales" }, { valor: "8,400+", label: "Clientes" }, { valor: "4.9★", label: "Valoración" }].map((s) => (
            <div key={s.label} className="bg-zinc-800 dark:bg-zinc-900 rounded-xl p-4">
              <p className="text-white font-bold text-lg">{s.valor}</p>
              <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-zinc-900 transition-colors duration-300">
        <div className="w-full max-w-sm space-y-8">
          {/* Header móvil */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
                <Scissors size={16} className="text-white dark:text-zinc-900" />
              </div>
              <span className="text-zinc-900 dark:text-white text-lg font-bold">Albro</span>
            </div>
            <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Bienvenido de nuevo</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Ingresa a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                Correo electrónico
              </Label>
              <Input
                id="email" name="email" type="email"
                placeholder="correo@ejemplo.com"
                value={form.email} onChange={handleChange}
                disabled={cargando} autoComplete="email"
                className="h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  Contraseña
                </Label>
                <a href="#" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password" name="password"
                  type={verPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  disabled={cargando} autoComplete="current-password"
                  className="h-11 pr-10 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" tabIndex={-1}>
                  {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-colors" disabled={cargando}>
              {cargando ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ingresando...</>) : "Ingresar"}
            </Button>
          </form>



          {/* Link a registro */}
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            ¿No tienes cuenta?{" "}
            <Link
              to="/registrarme"
              className="text-zinc-600 dark:text-zinc-300 font-medium hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;