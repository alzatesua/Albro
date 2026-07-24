import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  LogOut, User, Scissors, Map, Briefcase, UserCheck,
  Settings, CalendarClock, Users, Sun, Moon,
  CheckCircle2, XCircle, Bell, TrendingUp,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

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
import { getNotificaciones, marcarNotificacionLeida, marcarTodasNotificacionesLeidas } from "@/services/api"; // ajusta el path real
import { useNotificacionesWS } from "@/hooks/useNotificacionesWS";
import Toast from "@/components/Toast";
import HistoricoSection      from "@/pages/dashboard/HistoricoSection";
import ModalCalificarProfesional from "@/components/ModalCalificarProfesional";
import MisCitasSection from "@/pages/dashboard/MisCitasSection";
import ChatModal from "@/components/chat/ChatModal";

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
  { icono: Map,           label: "Mapa",            key: "mapa" },
  { icono: Briefcase,     label: "Servicios",       key: "servicios" },
  { icono: CalendarClock, label: "Mis citas",       key: "misCitas" },
  { icono: UserCheck,     label: "Ser profesional", key: "profesional" },
];

const menuProfesional = [
  { icono: Settings,      label: "Mi perfil",    key: "perfil" },
  { icono: CalendarClock, label: "Agenda",       key: "agenda" },
  { icono: Users,         label: "Mis clientes", key: "clientes" },
  { icono: TrendingUp,    label: "Historial",    key: "historico" },
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
    misCitas:    <MisCitasSection />,
    profesional: <SerProfesionalSection />,
    perfil:      <PerfilSection />,
    agenda:      <AgendaSection />,
    clientes:    <ClientesSection />,
    historico:   <HistoricoSection />,
  };

  // ── Notificaciones (dropdown) ────────────────────────────────────────────
  const NOTIF_PAGE_SIZE = 5;

  const [notificaciones, setNotificaciones] = useState([]); // solo no leídas
  const [notificacionesLeidas, setNotificacionesLeidas] = useState([]);
  const [mostrarLeidas, setMostrarLeidas] = useState(false);
  const [paginaLeidas, setPaginaLeidas] = useState(1);
  const [hayMasLeidas, setHayMasLeidas] = useState(true);
  const [cargandoLeidas, setCargandoLeidas] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
  const notifRef = useRef(null);
  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState(false);
  const menuPerfilRef = useRef(null);
  const [citaParaCalificar, setCitaParaCalificar] = useState(null);
  const [chatAbierto, setChatAbierto] = useState(null); 
  const chatAbiertoRef = useRef(null);
  const hayNuevas = notificaciones.length > 0;

  // ── Animación shake de la campana cada 10s mientras haya notificaciones nuevas ──
  const [animarCampana, setAnimarCampana] = useState(false);


  useEffect(() => {
    chatAbiertoRef.current = chatAbierto;
  }, [chatAbierto]);

  const esNotificacionDelChatVisible = useCallback((notif) => {
    const abierto = chatAbiertoRef.current;
    if (!abierto || notif?.tipo !== "mensaje") return false;
    return Number(notif?.data?.conversacion) === Number(abierto.conversacionId);
  }, []);

  useEffect(() => {
    if (!hayNuevas) return;

    const intervalo = setInterval(() => {
      setAnimarCampana(true);
      setTimeout(() => setAnimarCampana(false), 600);
    }, 10000);

    return () => clearInterval(intervalo);
  }, [hayNuevas]);
  
  useEffect(() => {
    const manejarClickAfuera = (e) => {
      if (menuPerfilRef.current && !menuPerfilRef.current.contains(e.target)) {
        setMostrarMenuPerfil(false);
      }
    };
    document.addEventListener("mousedown", manejarClickAfuera);
    return () => document.removeEventListener("mousedown", manejarClickAfuera);
  }, []);

  const cargarNotificaciones = async () => {
    setCargandoNotificaciones(true);
    try {
      const data = await getNotificaciones({ leida: false });
      setNotificaciones(data.results ?? data);
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
    } finally {
      setCargandoNotificaciones(false);
    }
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setMostrarNotificaciones(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const abrirNotificaciones = () => {
    setMostrarNotificaciones((v) => !v);
  };

  // Carga (o pide la siguiente página de) notificaciones ya leídas
  const cargarMasLeidas = async () => {
    setCargandoLeidas(true);
    try {
      const data = await getNotificaciones({
        leida: true,
        page: paginaLeidas,
        page_size: NOTIF_PAGE_SIZE,
      });
      const nuevos = data.results ?? data;
      setNotificacionesLeidas((prev) => [...prev, ...nuevos]);
      setHayMasLeidas(Boolean(data.next));
      setPaginaLeidas((p) => p + 1);
    } catch (err) {
      console.error("Error cargando notificaciones leídas:", err);
    } finally {
      setCargandoLeidas(false);
    }
  };

  const handleVerLeidas = () => {
    const abriendo = !mostrarLeidas;
    setMostrarLeidas(abriendo);
    // Primera vez que se abre: carga la página 1
    if (abriendo && notificacionesLeidas.length === 0) {
      cargarMasLeidas();
    }
  };

  // Marca una notificación como leída y la saca de la lista de "no leídas"
  const abrirDetalleNotificacion = async (n) => {
    setMostrarNotificaciones(false);

    if (!n.leida) {
      try {
        await marcarNotificacionLeida(n.id);
        setNotificaciones((prev) => prev.filter((x) => x.id !== n.id));
      } catch (err) {
        console.error("Error marcando notificación como leída:", err);
      }
    }

    if (n.tipo === "mensaje" && n.data?.conversacion) {
      setChatAbierto({
        conversacionId: n.data.conversacion,
        nombreContacto: n.data.remitente_nombre || "Chat",
      });
      return;
    }

    setNotificacionSeleccionada(n);
  };

  const formatearFecha = (isoString) => {
    const fecha = new Date(isoString);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "ahora mismo";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    return fecha.toLocaleDateString("es-CO");
  };
  // ──────────────────────────────────────────────────────────────────────────
 
  // ── Modal de notificación seleccionada ───────────────────────────────────
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState(null);
  // ──────────────────────────────────────────────────────────────────────────
  const colorEstado = (estado) => {
    switch (estado) {
      case "confirmada":  return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "pendiente":   return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "cancelada":   return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
      case "completada":  return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:            return "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };


  // Callback estable para agregar la notificación nueva al inicio de la lista
  const manejarNuevaNotificacion = useCallback((notif) => {
    setNotificaciones((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });

    if (!esNotificacionDelChatVisible(notif)) {
      setNotificacion({ tipo: "exito", titulo: notif.titulo, mensaje: notif.mensaje, key: Date.now() });
    }

    if (
      usuario?.rol === "cliente" &&
      notif.data?.estado === "completada" &&
      notif.data?.id
    ) {
      setCitaParaCalificar({
        cita_id: notif.data.id,
        profesional_nombre: notif.data.profesional_nombre,
        servicio_nombre: notif.data.servicio_nombre,
      });
    }
  }, [usuario, esNotificacionDelChatVisible]);

  useNotificacionesWS({ usuario, onNuevaNotificacion: manejarNuevaNotificacion });



  
  const irAConfigurarPerfil = () => {
    setMostrarMenuPerfil(false);
    localStorage.setItem("perfil_tab_activa", "personal"); // fuerza la pestaña "Datos personales"
    setSeccionActiva("perfil");
  };

  const irACambiarAProfesional = () => {
    setMostrarMenuPerfil(false);
    navigate("/convertirme-en-profesional"); // ajusta la ruta según tu flujo
  };

  


  return (
     <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300">

      <style>{`
        @keyframes shake-suave {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-3px); }
          40%, 60% { transform: translateX(3px); }
        }
        .animate-shake-suave {
          animation: shake-suave 0.6s ease-in-out;
        }
      `}</style>

      {/* ── Toast global, flota sobre todo el Dashboard ── */}
      <Toast toast={notificacion} onClose={() => setNotificacion(null)} />
        

      {/* ── Modal de detalle de notificación ── */}
      {notificacionSeleccionada && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate__animated animate__fadeIn animate__faster"
            onClick={() => setNotificacionSeleccionada(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-md overflow-hidden animate__animated animate__zoomIn animate__faster"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {notificacionSeleccionada.titulo}
                </span>
                <button
                  onClick={() => setNotificacionSeleccionada(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <XCircle size={16} />
                </button>
              </div>

              {/* Contenido */}
              <div className="px-5 py-4 space-y-3 text-sm">
                <p className="text-zinc-600 dark:text-zinc-300">{notificacionSeleccionada.mensaje}</p>

                {notificacionSeleccionada.data && (
                  <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
                    {notificacionSeleccionada.data.estado && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Estado</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorEstado(notificacionSeleccionada.data.estado)}`}>
                          {notificacionSeleccionada.data.estado}
                        </span>
                      </div>
                    )}
                    {notificacionSeleccionada.data.servicio_nombre && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Servicio</span>
                        <span className="text-zinc-800 dark:text-zinc-200">{notificacionSeleccionada.data.servicio_nombre}</span>
                      </div>
                    )}
                    {notificacionSeleccionada.data.categoria_nombre && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Categoría</span>
                        <span className="text-zinc-800 dark:text-zinc-200">{notificacionSeleccionada.data.categoria_nombre}</span>
                      </div>
                    )}
                    {notificacionSeleccionada.data.profesional_nombre && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Profesional</span>
                        <span className="text-zinc-800 dark:text-zinc-200">{notificacionSeleccionada.data.profesional_nombre}</span>
                      </div>
                    )}
                    {notificacionSeleccionada.data.usuario_nombre && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Cliente</span>
                        <span className="text-zinc-800 dark:text-zinc-200">{notificacionSeleccionada.data.usuario_nombre}</span>
                      </div>
                    )}
                    {notificacionSeleccionada.data.fecha && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Fecha</span>
                        <span className="text-zinc-800 dark:text-zinc-200">
                          {new Date(notificacionSeleccionada.data.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    {notificacionSeleccionada.data.etiqueta && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Horario</span>
                        <span className="text-zinc-800 dark:text-zinc-200">{notificacionSeleccionada.data.etiqueta}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">
                  Recibida {formatearFecha(notificacionSeleccionada.fecha_creacion)}
                </p>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotificacionSeleccionada(null)}
                  className="text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 dark:bg-transparent"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
      {/* ─────────────────────────────────────── */}

      {/* Navbar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Scissors size={18} className="text-white dark:text-zinc-900" />
          </div>
          <span className="text-zinc-900 dark:text-white text-lg font-bold">Albro</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* ── Campana de notificaciones ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={abrirNotificaciones}
              className="relative w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <div
                className={`relative flex items-center justify-center ${
                  animarCampana ? "animate-shake-suave" : ""
                }`}
              >
                <Bell size={20} />
                {hayNuevas && (
                  <span className="absolute top-0 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                )}
              </div>
            </button>

            {mostrarNotificaciones && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 animate__animated animate__fadeIn animate__faster">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Notificaciones</span>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {/* ── No leídas ── */}
                  {cargandoNotificaciones ? (
                    <div className="px-4 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
                      Cargando...
                    </div>
                  ) : notificaciones.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
                      No tienes notificaciones nuevas
                    </div>
                  ) : (
                    notificaciones.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => abrirDetalleNotificacion(n)}
                        className="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800 last:border-0 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-800 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50"
                      >
                        <p className="font-medium">{n.titulo}</p>
                        <p className="text-xs mt-0.5">{n.mensaje}</p>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {formatearFecha(n.fecha_creacion)}
                        </span>
                      </div>
                    ))
                  )}

                  {/* ── Botón para ver leídas ── */}
                  <button
                    onClick={handleVerLeidas}
                    className="w-full px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border-b border-zinc-50 dark:border-zinc-800 transition-colors"
                  >
                    {mostrarLeidas ? "Ocultar leídas" : "Ver leídas"}
                  </button>

                  {/* ── Leídas (colapsable, con paginación) ── */}
                  {mostrarLeidas && (
                    <>
                      {notificacionesLeidas.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => abrirDetalleNotificacion(n)}
                          className="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800 last:border-0 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
                        >
                          <p className="font-medium">{n.titulo}</p>
                          <p className="text-xs mt-0.5">{n.mensaje}</p>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {formatearFecha(n.fecha_creacion)}
                          </span>
                        </div>
                      ))}

                      {notificacionesLeidas.length === 0 && !cargandoLeidas && (
                        <div className="px-4 py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                          No hay notificaciones leídas
                        </div>
                      )}

                      {hayMasLeidas && (
                        <button
                          onClick={cargarMasLeidas}
                          disabled={cargandoLeidas}
                          className="w-full px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 disabled:opacity-50 transition-colors"
                        >
                          {cargandoLeidas ? "Cargando..." : "Cargar más"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* ─────────────────────────────────────── */}

          <div className="relative" ref={menuPerfilRef}>
            <button
              type="button"
              onClick={() => setMostrarMenuPerfil((v) => !v)}
              className="flex items-center gap-2 text-sm rounded-xl px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <User size={18} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {usuario?.nombre} {usuario?.apellido}
              </span>
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full capitalize">
                {usuario?.rol}
              </span>
            </button>

            {mostrarMenuPerfil && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 animate__animated animate__fadeIn animate__faster">
                <button
                  onClick={irAConfigurarPerfil}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <Settings size={15} className="text-zinc-400 dark:text-zinc-500" />
                  Configurar perfil
                </button>

                {usuario?.rol === "cliente" && (
                  <button
                    onClick={irACambiarAProfesional}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <Briefcase size={15} className="text-zinc-400 dark:text-zinc-500" />
                    Cambiar a profesional
                  </button>
                )}
              </div>
            )}
          </div>

          <Button
            variant="outline" size="sm"
            onClick={() => { limpiarSesion(); navigate("/login"); }}
            className="text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border-zinc-200 dark:border-zinc-700 dark:bg-transparent"
          >
            <LogOut size={18} className="mr-1.5" />
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

      {/* Modal para calificar profesional después de una cita completada */}
      {citaParaCalificar && (
        <ModalCalificarProfesional
          cita={citaParaCalificar}
          onClose={() => setCitaParaCalificar(null)}
          onCalificado={() => setCitaParaCalificar(null)}
        />
      )}

      <ChatModal
        abierto={!!chatAbierto}
        conversacionId={chatAbierto?.conversacionId}
        nombreContacto={chatAbierto?.nombreContacto}
        onClose={() => setChatAbierto(null)}
      />

    </div>
  );
};

export default DashboardPage;