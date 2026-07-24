import { useEffect, useState, useCallback } from "react";
import { Search, Star, ChevronLeft, ChevronRight, Users, Calendar, MessageCircle } from "lucide-react";
import { getMisClientesUnicos } from "../../services/api";
import ChatModal from "../../components/chat/ChatModal"; // ajusta la ruta según dónde quede tu carpeta chat

const PAGE_SIZE = 10;

// ─── Iniciales para el avatar cuando no hay foto ──────────────────────────
const iniciales = (nombre, apellido) =>
  `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();

// ─── Estrellas: llenas + vacías, con el promedio redondeado a 1 decimal ───
const Estrellas = ({ promedio }) => {
  if (promedio == null) {
    return <span className="text-xs text-zinc-400 dark:text-zinc-500">Sin calificar</span>;
  }
  const llenas = Math.round(promedio);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={13}
            className={i <= llenas ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600"}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{promedio.toFixed(1)}</span>
    </div>
  );
};

const formatearFecha = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(`${fecha}T00:00:00`);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const ClientesSection = () => {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);

  const [chatAbierto, setChatAbierto] = useState(false);
  const [clienteChat, setClienteChat] = useState(null);

  const abrirChat = (cliente) => {
    setClienteChat(cliente);
    setChatAbierto(true);
  };
  const cargarClientes = useCallback(async (paginaActual) => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMisClientesUnicos({ page: paginaActual, page_size: PAGE_SIZE });
      setClientes(data.results || []);
      setTotalClientes(data.count || 0);
      setTotalPaginas(Math.max(1, Math.ceil((data.count || 0) / PAGE_SIZE)));
    } catch (err) {
      console.error("Error cargando clientes:", err);
      setError(err.message || "No se pudo cargar tu lista de clientes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarClientes(pagina);
  }, [pagina, cargarClientes]);

  const clientesFiltrados = clientes.filter((c) => {
    if (!busqueda.trim()) return true;
    const texto = `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase();
    return texto.includes(busqueda.trim().toLowerCase());
  });

  // ─── Estado: cargando ────────────────────────────────────────────────
  if (cargando && clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mb-3" />
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Cargando tus clientes…</p>
      </div>
    );
  }

  // ─── Estado: error ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <span className="text-4xl mb-3">⚠️</span>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">{error}</p>
        <button
          onClick={() => cargarClientes(pagina)}
          className="mt-4 text-xs px-4 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ─── Estado: vacío ───────────────────────────────────────────────────
  if (!cargando && totalClientes === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-5xl mb-4">👥</p>
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">Mis clientes</h2>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
          Aún no tienes clientes. Aparecerán aquí después de tu primera cita.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Users size={20} className="text-zinc-400" />
            Mis clientes
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            {totalClientes} {totalClientes === 1 ? "cliente" : "clientes"} en total
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2.5 flex items-center gap-2.5 shadow-sm mb-5">
        <Search size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo"
          className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
        />
      </div>

      {/* Lista de clientes */}
      <div className="space-y-2.5">
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-zinc-400">Sin resultados para "{busqueda}"</p>
          </div>
        ) : (
          clientesFiltrados.map((cliente) => (
            <div
              key={cliente.cliente_id}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3.5 flex items-center gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
            >
              {/* Avatar iniciales */}
              <div className="w-11 h-11 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-sm font-semibold shrink-0">
                {iniciales(cliente.nombre, cliente.apellido)}
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                    {cliente.nombre} {cliente.apellido}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{cliente.email}</span>
                </div>
              </div>

              {/* Métricas: citas + estrellas + última visita */}
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <Estrellas promedio={cliente.promedio_estrellas} />
                <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                  <Calendar size={11} />
                  <span>{formatearFecha(cliente.ultima_cita)}</span>
                </div>
              </div>

              {/* Botón de chat */}
              <button
                onClick={() => abrirChat(cliente)}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-900 transition-colors shrink-0"
                title={`Chatear con ${cliente.nombre}`}
              >
                <MessageCircle size={16} />
              </button>

              {/* Badge total de citas */}
              <div className="shrink-0 text-center">
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{cliente.total_citas}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                  {cliente.total_citas === 1 ? "cita" : "citas"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1 || cargando}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas || cargando}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      <ChatModal
        abierto={chatAbierto}
        onClose={() => setChatAbierto(false)}
        clienteId={clienteChat?.cliente_id}
        nombreContacto={clienteChat ? `${clienteChat.nombre} ${clienteChat.apellido}` : ""}
      />
    </div>
  );
};

export default ClientesSection;