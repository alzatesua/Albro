import { NavLink } from "react-router";
import { useAuthAdmin } from "@/context/AuthContextAdmin";
import {
  Clock,
  CircleCheck,
  BarChart3,
  LogOut,
} from "lucide-react";

const ITEMS_MENU = [
  {
    to: "/gestion-x9k2/pagos-pendientes",
    icono: Clock,
    etiqueta: "Pagos pendientes",
  },
  {
    to: "/gestion-x9k2/pagos-confirmados",
    icono: CircleCheck,
    etiqueta: "Pagos confirmados",
  },
  {
    to: "/gestion-x9k2/metricas",
    icono: BarChart3,
    etiqueta: "Métricas",
  },
];

export default function AdminSidebar() {
  const { limpiarSesionAdmin } = useAuthAdmin();

  return (
    <aside
      className="w-64 min-h-screen flex flex-col shrink-0"
      style={{
        background: "#0a0a0a",
        borderRight: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-white/35 text-[11px] tracking-[0.25em] uppercase">
          Panel administrativo
        </p>
        <p className="text-white font-semibold text-sm mt-1">Albro</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {ITEMS_MENU.map(({ to, icono: Icono, etiqueta }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              border: isActive ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
            })}
          >
            <Icono size={16} />
            {etiqueta}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={limpiarSesionAdmin}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}