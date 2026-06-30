import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LogOut, User, Scissors, Map, Briefcase, UserCheck,
  Settings, CalendarClock, Users, Sun, Moon
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

// ─── Hook modo oscuro ─────────────────────────────────────────────────────────
const useDarkMode = () => {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  return [dark, () => setDark((d) => !d)];
};

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

const secciones = {
  mapa:        <MapaSection />,
  servicios:   <ServiciosSection />,
  profesional: <SerProfesionalSection />,
  perfil:      <PerfilSection />,
  agenda:      <AgendaSection />,
  clientes:    <ClientesSection />,
};

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

  const esProfesional = usuario?.rol === "profesional";
  const menu = esProfesional ? menuProfesional : menuCliente;
  const [seccionActiva, setSeccionActiva] = useState(menu[0].key);

  // Verifica si el profesional ya completó su perfil
  const { necesitaPerfil, marcarCompleto } = usePerfilProfesional(usuario?.rol);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">

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
      <main className={seccionActiva === "mapa" ? "flex-1" : "flex-1 max-w-5xl w-full mx-auto px-6 py-10 pb-36"}>
        {seccionActiva !== "mapa" && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Hola, {usuario?.nombre}
            </h1>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
              {esProfesional ? "Gestiona tu agenda y tus clientes" : "¿Qué quieres hacer hoy?"}
            </p>
          </div>
        )}

        {/* Sección activa */}
        <div className={seccionActiva === "mapa" ? "" : "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden p-8 min-h-64"}>
          {secciones[seccionActiva]}
        </div>
      </main>

      {/* Dock */}
      <Dock menu={menu} seccionActiva={seccionActiva} setSeccionActiva={setSeccionActiva} />

      {/* Modal bloqueante — solo aparece si es profesional y no tiene perfil aún */}
      {necesitaPerfil === true && (
        <ModalRegistroProfesional onCompleto={marcarCompleto} />
      )}

    </div>
  );
};

export default DashboardPage;