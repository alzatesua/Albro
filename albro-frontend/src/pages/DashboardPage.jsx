import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LogOut, User, Scissors, Map, Briefcase, UserCheck,
  Settings, CalendarClock, Users, Sun, Moon,
  CheckCircle2, XCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// ─── Secciones ────────────────────────────────────────────────────────────────
import MapaSection           from "@/pages/dashboard/MapaSection";
import ServiciosSection      from "@/pages/dashboard/ServiciosSection";
import SerProfesionalSection from "@/pages/dashboard/SerProfesionalSection";
import PerfilSection         from "@/pages/dashboard/PerfilSection";
import AgendaSection         from "@/pages/dashboard/AgendaSection";
import ClientesSection       from "@/pages/dashboard/ClientesSection";

// ─── Modal y hook perfil profesional ─────────────────────────────────────────
import ModalRegistroProfesional from "@/components/ModalRegistroProfesional";
import { usePerfilProfesional } from "@/hooks/usePerfilProfesional";
import Portal from "@/components/ui/Portal";

// ─── Hook modo oscuro ─────────────────────────────────────────────────────────
const useDarkMode = () => {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, () => setDark((d) => !d)];
};

// ─── Persistencia de la sección activa ───────────────────────────────────────
const SECCION_STORAGE_KEY = "dashboard_seccion_activa";

// ─── Menús por rol ────────────────────────────────────────────────────────────
const menuCliente = [
  { icono: Map,        label: "Mapa",            key: "mapa" },
  { icono: Briefcase,  label: "Servicios",       key: "servicios" },
  { icono: UserCheck,  label: "Ser profesional", key: "profesional" },
];

const menuProfesional = [
  { icono: Settings,      label: "Mi perfil",    key: "perfil" },
  { icono: CalendarClock, label: "Agenda",       key: "agenda" },
  { icono: Users,         label: "Mis clientes", key: "clientes" },
];

// ─── Dock item ────────────────────────────────────────────────────────────────
const DockItem = ({ icono: Icono, label, activo, onClick, mouseX, itemRef }) => {
  const [size, setSize] = useState(48);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (mouseX === null || !itemRef?.current) { setSize(48); return; }
    const rect = itemRef.current.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const dist = Math.abs(mouseX - center);
    if (dist < 120) setSize(48 * (1 + (1 - dist / 120) * 0.85));
    else setSize(48);
  }, [mouseX, itemRef]);

  const headerRef = useRef(null);
  useEffect(() => {
    if (headerRef.current) {
      document.documentElement.style.setProperty(
        "--header-height",
        `${headerRef.current.offsetHeight}px`
      );
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-end" style={{ height: 80 }}>
      {hover && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-3 py-1 rounded-lg whitespace-nowrap shadow-lg pointer-events-none z-50">
          {label}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-zinc-800 dark:border-t-zinc-100" />
        </div>
      )}
      <button
        ref={itemRef}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ width: size, height: size }}
        className={`rounded-2xl flex items-center justify-center transition-all duration-150 ease-out shadow-md
          ${activo
            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
            : "bg-white/90 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-700"
          }`}
      >
        <Icono style={{ width: size * 0.42, height: size * 0.42 }} />
      </button>
      <div className={`mt-1.5 w-1 h-1 rounded-full ${activo ? "bg-zinc-900 dark:bg-white" : "bg-transparent"}`} />
    </div>
  );
};

// ─── Dock ─────────────────────────────────────────────────────────────────────
const Dock = ({ menu, seccionActiva, setSeccionActiva }) => {
  const [mouseX, setMouseX] = useState(null);
  const refs = menu.map(() => useRef(null));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
      <div
        className="flex items-end gap-3 px-6 py-3 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xl"
        onMouseMove={(e) => setMouseX(e.clientX)}
        onMouseLeave={() => setMouseX(null)}
      >
        {menu.map(({ icono, label, key }, i) => (
          <DockItem
            key={key}
            icono={icono}
            label={label}
            activo={seccionActiva === key}
            onClick={() => setSeccionActiva(key)}
            mouseX={mouseX}
            itemRef={refs[i]}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { usuario, limpiarSesion } = useAuth();
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();

  // ── NUEVO: estado global de notificación ────────────────────────────────
  const [notificacion, setNotificacion] = useState(null); // { tipo: "exito" | "error", mensaje }

  useEffect(() => {
    if (!notificacion) return;
    const t = setTimeout(() => setNotificacion(null), 3500);
    return () => clearTimeout(t);
  }, [notificacion]);
  // ──────────────────────────────────────────────────────────────────────────

  const esProfesional = usuario?.rol === "profesional";
  const menu = esProfesional ? menuProfesional : menuCliente;

  // ── NUEVO: sección activa persistida en localStorage ─────────────────────
  const [seccionActiva, setSeccionActivaState] = useState(() => {
    const guardada = localStorage.getItem(SECCION_STORAGE_KEY);
    const esValida = guardada && menu.some((item) => item.key === guardada);
    return esValida ? guardada : menu[0].key;
  });

  // Si el rol cambia (ej. el usuario se vuelve profesional) y la sección
  // guardada ya no pertenece al menú actual, volvemos a la primera opción.
  useEffect(() => {
    const esValida = menu.some((item) => item.key === seccionActiva);
    if (!esValida) {
      setSeccionActivaState(menu[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esProfesional]);

  const setSeccionActiva = (key) => {
    setSeccionActivaState(key);
    localStorage.setItem(SECCION_STORAGE_KEY, key);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const { necesitaPerfil, marcarCompleto } = usePerfilProfesional(usuario?.rol);

  // ── Movido acá dentro para poder pasar setNotificacion como prop ────────
  const secciones = {
    mapa:        <MapaSection />,
    servicios:   <ServiciosSection onNotificar={setNotificacion} />,
    profesional: <SerProfesionalSection />,
    perfil:      <PerfilSection />,
    agenda:      <AgendaSection />,
    clientes:    <ClientesSection />,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">

      {/* ── NUEVO: Toast global, flota sobre todo el Dashboard ── */}
      {notificacion && (
        <Portal>
          <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate__animated animate__fadeInDown
                ${notificacion.tipo === "exito"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"}`}
            >
              {notificacion.tipo === "exito" ? (
                <CheckCircle2 size={18} className="shrink-0" />
              ) : (
                <XCircle size={18} className="shrink-0" />
              )}
              {notificacion.mensaje}
            </div>
          </div>
        </Portal>
      )}

      {/* Navbar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Scissors size={16} className="text-white dark:text-zinc-900" />
          </div>
          <span className="text-zinc-900 dark:text-white text-lg font-bold">Albro</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <User size={14} className="text-zinc-500 dark:text-zinc-400" />
            </div>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {usuario?.nombre} {usuario?.apellido}
            </span>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full capitalize">
              {usuario?.rol}
            </span>
          </div>

          <Button
            variant="outline" size="sm"
            onClick={() => { limpiarSesion(); navigate("/login"); }}
            className="text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border-zinc-200 dark:border-zinc-700 dark:bg-transparent"
          >
            <LogOut size={14} className="mr-1.5" />
            Salir
          </Button>
        </div>
      </header>

      {/* Contenido */}
      <main className={seccionActiva === "mapa" ? "flex-1" : "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-8 min-h-64"}>
        {seccionActiva !== "mapa" && <div className="mb-8" />}

        <div className={seccionActiva === "mapa" ? "" : "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-8 min-h-64"}>
          {secciones[seccionActiva]}
        </div>
      </main>

      <Dock menu={menu} seccionActiva={seccionActiva} setSeccionActiva={setSeccionActiva} />

      {necesitaPerfil === true && (
        <ModalRegistroProfesional onCompleto={marcarCompleto} />
      )}

    </div>
  );
};

export default DashboardPage;