import { useEffect, useMemo, useState, useCallback } from "react";
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getTodasLasCitas } from "../../services/api";

// ─── Detecta modo oscuro observando la clase del <html> ───────────────────
const useEsOscuro = () => {
  const [oscuro, setOscuro] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setOscuro(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return oscuro;
};

// ─── Agrupadores ────────────────────────────────────────────────────────────
const agruparPorDia = (citas) => {
  const hoy = new Date();
  const dias = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dias.push({
      key,
      label: d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
      total: 0,
    });
  }
  const mapa = new Map(dias.map((d) => [d.key, d]));
  citas.forEach((c) => {
    const item = mapa.get(c.fecha);
    if (item) item.total += 1;
  });
  return dias;
};

const agruparPorMes = (citas) => {
  const hoy = new Date();
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push({
      key,
      label: d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
      total: 0,
    });
  }
  const mapa = new Map(meses.map((m) => [m.key, m]));
  citas.forEach((c) => {
    const key = c.fecha.slice(0, 7);
    const item = mapa.get(key);
    if (item) item.total += 1;
  });
  return meses;
};

const agruparPorAnio = (citas) => {
  const anios = new Map();
  citas.forEach((c) => {
    const anio = c.fecha.slice(0, 4);
    anios.set(anio, (anios.get(anio) || 0) + 1);
  });
  if (anios.size === 0) {
    const actual = String(new Date().getFullYear());
    return [{ key: actual, label: actual, total: 0 }];
  }
  return Array.from(anios.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([anio, total]) => ({ key: anio, label: anio, total }));
};

// ─── Filtros de estado ──────────────────────────────────────────────────────
const ESTADOS = [
  { key: "", label: "Todas" },
  { key: "completada", label: "Completadas" },
  { key: "confirmada", label: "Confirmadas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "cancelada", label: "Canceladas" },
];

const PERIODOS = [
  { key: "dia", label: "Día", icono: CalendarDays },
  { key: "mes", label: "Mes", icono: Calendar },
  { key: "anio", label: "Año", icono: CalendarRange },
];

// ─── Tooltip personalizado ──────────────────────────────────────────────────
const TooltipPersonalizado = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-zinc-700 dark:text-zinc-200">{label}</p>
      <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
        <span className="font-bold text-zinc-800 dark:text-zinc-100">{payload[0].value}</span> citas
      </p>
    </div>
  );
};

const HistoricoSection = () => {
  const oscuro = useEsOscuro();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState("mes");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getTodasLasCitas({ estado: estadoFiltro || undefined });
      setCitas(data);
    } catch (err) {
      console.error("Error cargando histórico:", err);
      setError(err.message || "No se pudo cargar el histórico.");
    } finally {
      setCargando(false);
    }
  }, [estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const datos = useMemo(() => {
    if (periodo === "dia") return agruparPorDia(citas);
    if (periodo === "anio") return agruparPorAnio(citas);
    return agruparPorMes(citas);
  }, [citas, periodo]);

  const totalPeriodo = datos.reduce((acc, d) => acc + d.total, 0);
  const pico = datos.reduce((max, d) => Math.max(max, d.total), 0);
  const promedio = datos.length ? (totalPeriodo / datos.length).toFixed(1) : "0.0";

  const colorLinea = oscuro ? "#f4f4f5" : "#18181b";
  const colorGrid = oscuro ? "#3f3f46" : "#e4e4e7";
  const colorTexto = oscuro ? "#a1a1aa" : "#a1a1aa";

  // ─── Estado: cargando ─────────────────────────────────────────────────
  if (cargando && citas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mb-3" />
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Cargando tu histórico…</p>
      </div>
    );
  }

  // ─── Estado: error ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <span className="text-4xl mb-3">⚠️</span>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">{error}</p>
        <button
          onClick={cargar}
          className="mt-4 text-xs px-4 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <TrendingUp size={20} className="text-zinc-400" />
            Historial de citas
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Evolución de tus citas en el tiempo
          </p>
        </div>

        {/* Filtro de periodo */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
          {PERIODOS.map(({ key, label, icono: Icono }) => (
            <button
              key={key}
              onClick={() => setPeriodo(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                periodo === key
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icono size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ESTADOS.map(({ key, label }) => (
          <button
            key={key || "todas"}
            onClick={() => setEstadoFiltro(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              estadoFiltro === key
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3.5">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Total en el periodo</p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{totalPeriodo}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3.5">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Promedio</p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{promedio}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3.5">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Pico máximo</p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{pico}</p>
        </div>
      </div>

      {/* Gráfica */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotalCitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorLinea} stopOpacity={0.25} />
                <stop offset="95%" stopColor={colorLinea} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colorGrid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: colorTexto }}
              axisLine={false}
              tickLine={false}
              interval={periodo === "dia" ? 3 : 0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: colorTexto }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<TooltipPersonalizado />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={colorLinea}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#colorTotalCitas)"
              dot={{ r: 3, fill: colorLinea, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={true}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoricoSection;