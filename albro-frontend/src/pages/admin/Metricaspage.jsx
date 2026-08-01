import { useState, useEffect, useMemo } from "react";
import { getPagosPendientesAdmin, getPagosConfirmadosAdmin } from "@/services/api";
import {
  RefreshCw,
  AlertCircle,
  CircleCheck,
  Clock,
  Wallet,
  TrendingUp,
  Users,
  Percent,
} from "lucide-react";

export default function MetricasPage() {
  const [pendientes, setPendientes] = useState([]);
  const [confirmados, setConfirmados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async ({ silencioso = false } = {}) => {
    if (silencioso) {
      setRefrescando(true);
    } else {
      setCargando(true);
    }
    setError("");
    try {
      const [dataPendientes, dataConfirmados] = await Promise.all([
        getPagosPendientesAdmin(),
        getPagosConfirmadosAdmin(),
      ]);
      setPendientes(dataPendientes.pagos || []);
      setConfirmados(dataConfirmados.pagos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ─── KPIs ───────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const montoConfirmado = confirmados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const montoPendiente = pendientes.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const totalConfirmados = confirmados.length;
    const totalPendientes = pendientes.length;
    const promedio = totalConfirmados > 0 ? montoConfirmado / totalConfirmados : 0;
    const usuariosUnicos = new Set(confirmados.map((p) => p.usuario_email)).size;
    const totalSolicitudes = totalConfirmados + totalPendientes;
    const tasaConversion = totalSolicitudes > 0 ? (totalConfirmados / totalSolicitudes) * 100 : 0;

    return {
      montoConfirmado,
      montoPendiente,
      totalConfirmados,
      totalPendientes,
      promedio,
      usuariosUnicos,
      tasaConversion,
    };
  }, [pendientes, confirmados]);

  // ─── Desglose por plan (para gráfico de barras) ───────────────────────
  const porPlan = useMemo(() => {
    const acc = {};
    confirmados.forEach((p) => {
      const plan = p.plan || "sin plan";
      if (!acc[plan]) {
        acc[plan] = { plan, monto: 0, cantidad: 0 };
      }
      acc[plan].monto += Number(p.monto || 0);
      acc[plan].cantidad += 1;
    });
    return Object.values(acc).sort((a, b) => b.monto - a.monto);
  }, [confirmados]);

  // ─── Pagos confirmados por día, últimos 14 días ───────────────────────
  const serieDiaria = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dias = [];
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      dias.push({
        fecha,
        clave: fecha.toISOString().slice(0, 10),
        cantidad: 0,
        monto: 0,
      });
    }

    const mapaDias = Object.fromEntries(dias.map((d) => [d.clave, d]));

    confirmados.forEach((p) => {
      if (!p.fecha_creacion) return;
      const clave = new Date(p.fecha_creacion).toISOString().slice(0, 10);
      if (mapaDias[clave]) {
        mapaDias[clave].cantidad += 1;
        mapaDias[clave].monto += Number(p.monto || 0);
      }
    });

    return dias;
  }, [confirmados]);

  return (
    <div className="w-full px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-white/35 text-[11px] tracking-[0.25em] uppercase mb-1">
            Panel administrativo
          </p>
          <h1 className="text-2xl font-semibold text-white">Métricas</h1>
        </div>

        <button
          onClick={() => cargarDatos({ silencioso: true })}
          disabled={refrescando || cargando}
          className="h-10 px-4 rounded-xl text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-all disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <RefreshCw size={15} className={refrescando ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm text-white/90"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.25)" }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {cargando ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* ─── KPIs + Gráfico de torta ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Tarjetas de métricas */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TarjetaMetrica
                icono={<CircleCheck size={13} />}
                etiqueta="Pagos confirmados"
                valor={kpis.totalConfirmados}
              />
              <TarjetaMetrica
                icono={<Wallet size={13} />}
                etiqueta="Monto confirmado"
                valor={kpis.montoConfirmado.toLocaleString("es-CO") + " COP"}
              />
              <TarjetaMetrica
                icono={<TrendingUp size={13} />}
                etiqueta="Ticket promedio"
                valor={Math.round(kpis.promedio).toLocaleString("es-CO") + " COP"}
              />
              <TarjetaMetrica
                icono={<Clock size={13} />}
                etiqueta="Pagos pendientes"
                valor={kpis.totalPendientes}
              />
              <TarjetaMetrica
                icono={<Wallet size={13} />}
                etiqueta="Monto pendiente"
                valor={kpis.montoPendiente.toLocaleString("es-CO") + " COP"}
              />
              <TarjetaMetrica
                icono={<Percent size={13} />}
                etiqueta="Tasa de conversión"
                valor={kpis.tasaConversion.toFixed(1) + "%"}
              />
            </div>

            {/* Gráfico de torta */}
            <div
              className="rounded-2xl p-6 flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <p className="text-white/40 text-xs tracking-wide uppercase mb-5 self-start">
                Confirmados vs pendientes
              </p>
              <GraficoTorta
                datos={[
                  { etiqueta: "Confirmado", valor: kpis.montoConfirmado, color: "rgba(255,255,255,0.85)" },
                  { etiqueta: "Pendiente", valor: kpis.montoPendiente, color: "rgba(255,255,255,0.25)" },
                ]}
              />
            </div>
          </div>

          {/* ─── Tendencia diaria ───────────────────────────────────── */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <p className="text-white/40 text-xs tracking-wide uppercase mb-5">
              Pagos confirmados — últimos 14 días
            </p>
            <GraficoBarras datos={serieDiaria} />
          </div>

          {/* ─── Desglose por plan ──────────────────────────────────── */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <p className="text-white/40 text-xs tracking-wide uppercase mb-5">
              Monto confirmado por plan
            </p>
            {porPlan.length === 0 ? (
              <p className="text-white/50 text-sm">Todavía no hay pagos confirmados.</p>
            ) : (
              <GraficoBarrasHorizontal datos={porPlan} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaMetrica({ icono, etiqueta, valor }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="flex items-center gap-2 text-white/40 text-xs tracking-wide uppercase mb-2">
        {icono}
        {etiqueta}
      </div>
      <p className="text-2xl font-semibold text-white truncate">{valor}</p>
    </div>
  );
}

// ─── Gráfico de torta (donut) ─────────────────────────────────────────────
function GraficoTorta({ datos }) {
  const total = datos.reduce((acc, d) => acc + d.valor, 0);
  const radio = 70;
  const grosor = 22;
  const circunferencia = 2 * Math.PI * radio;

  let acumulado = 0;
  const segmentos = datos.map((d) => {
    const proporcion = total > 0 ? d.valor / total : 0;
    const largo = proporcion * circunferencia;
    const offset = circunferencia - acumulado;
    acumulado += largo;
    return { ...d, proporcion, largo, offset };
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <svg viewBox="0 0 180 180" className="w-40 h-40 -rotate-90">
        <circle
          cx="90"
          cy="90"
          r={radio}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={grosor}
        />
        {total > 0 &&
          segmentos.map((s) => (
            <circle
              key={s.etiqueta}
              cx="90"
              cy="90"
              r={radio}
              fill="none"
              stroke={s.color}
              strokeWidth={grosor}
              strokeDasharray={`${s.largo} ${circunferencia - s.largo}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            >
              <title>
                {s.etiqueta}: {s.valor.toLocaleString("es-CO")} COP ({(s.proporcion * 100).toFixed(1)}%)
              </title>
            </circle>
          ))}
        {/* Texto central (sin rotar) */}
        <g transform="rotate(90 90 90)">
          <text
            x="90"
            y="86"
            textAnchor="middle"
            fontSize="22"
            fontWeight="600"
            fill="white"
          >
            {total > 0 ? Math.round((datos[0].valor / total) * 100) : 0}%
          </text>
          <text
            x="90"
            y="104"
            textAnchor="middle"
            fontSize="9"
            fill="rgba(255,255,255,0.4)"
          >
            confirmado
          </text>
        </g>
      </svg>

      {/* Leyenda */}
      <div className="flex gap-5">
        {datos.map((d) => (
          <div key={d.etiqueta} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-white/70 text-xs">{d.etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gráfico de barras verticales (tendencia diaria) ─────────────────────
function GraficoBarras({ datos }) {
  const ancho = 700;
  const alto = 200;
  const padding = 30;
  const maxCantidad = Math.max(1, ...datos.map((d) => d.cantidad));
  const anchoBarra = (ancho - padding * 2) / datos.length;

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-48" preserveAspectRatio="none">
      {/* Línea base */}
      <line
        x1={padding}
        y1={alto - padding}
        x2={ancho - padding}
        y2={alto - padding}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {datos.map((d, i) => {
        const alturaBarra = maxCantidad > 0 ? (d.cantidad / maxCantidad) * (alto - padding * 2) : 0;
        const x = padding + i * anchoBarra + anchoBarra * 0.15;
        const y = alto - padding - alturaBarra;
        const anchoReal = anchoBarra * 0.7;
        const esFinDeSemana = [0, 6].includes(d.fecha.getDay());

        return (
          <g key={d.clave}>
            <rect
              x={x}
              y={y}
              width={anchoReal}
              height={Math.max(alturaBarra, d.cantidad > 0 ? 2 : 0)}
              rx="3"
              fill={esFinDeSemana ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)"}
            >
              <title>
                {d.fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}: {d.cantidad} pagos
              </title>
            </rect>
            {i % 2 === 0 && (
              <text
                x={x + anchoReal / 2}
                y={alto - padding + 16}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.4)"
              >
                {d.fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Gráfico de barras horizontales (desglose por plan) ──────────────────
function GraficoBarrasHorizontal({ datos }) {
  const maxMonto = Math.max(1, ...datos.map((d) => d.monto));

  return (
    <div className="space-y-4">
      {datos.map((d) => {
        const porcentaje = (d.monto / maxMonto) * 100;
        return (
          <div key={d.plan}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/80 text-sm font-medium capitalize">{d.plan}</span>
              <span className="text-white/50 text-xs">
                {d.monto.toLocaleString("es-CO")} COP · {d.cantidad} pagos
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${porcentaje}%`, background: "rgba(255,255,255,0.85)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}