import { useState, useEffect, useMemo } from "react";
import { getPagosConfirmadosAdmin } from "@/services/api";
import {
  RefreshCw,
  FileText,
  CircleCheck,
  AlertCircle,
  TrendingUp,
  Wallet,
  Users,
  Search,
} from "lucide-react";

const PANEL_BASE_URL = import.meta.env.VITE_API_URL_PANEL || "http://localhost:8006";

export default function PagosConfirmadosPage() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroPlan, setFiltroPlan] = useState("todos");

  const cargarPagos = async ({ silencioso = false } = {}) => {
    if (silencioso) {
      setRefrescando(true);
    } else {
      setCargando(true);
    }
    setError("");
    try {
      const data = await getPagosConfirmadosAdmin();
      setPagos(data.pagos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const metricas = useMemo(() => {
    const totalMonto = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const totalPagos = pagos.length;
    const promedio = totalPagos > 0 ? totalMonto / totalPagos : 0;
    const usuariosUnicos = new Set(pagos.map((p) => p.usuario_email)).size;

    const porPlan = pagos.reduce((acc, p) => {
      const plan = p.plan || "sin plan";
      if (!acc[plan]) {
        acc[plan] = { cantidad: 0, monto: 0 };
      }
      acc[plan].cantidad += 1;
      acc[plan].monto += Number(p.monto || 0);
      return acc;
    }, {});

    return { totalMonto, totalPagos, promedio, usuariosUnicos, porPlan };
  }, [pagos]);

  const planesDisponibles = useMemo(() => {
    return ["todos", ...Object.keys(metricas.porPlan)];
  }, [metricas.porPlan]);

  const pagosFiltrados = useMemo(() => {
    return pagos.filter((p) => {
      const textoBusqueda = busqueda.toLowerCase();
      const emailCoincide = p.usuario_email
        ? p.usuario_email.toLowerCase().includes(textoBusqueda)
        : false;
      const referenciaCoincide = p.referencia_interna
        ? p.referencia_interna.toLowerCase().includes(textoBusqueda)
        : false;
      const coincideBusqueda = !busqueda || emailCoincide || referenciaCoincide;
      const coincidePlan = filtroPlan === "todos" || p.plan === filtroPlan;
      return coincideBusqueda && coincidePlan;
    });
  }, [pagos, busqueda, filtroPlan]);

  return (
    <div className="w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/35 text-[11px] tracking-[0.25em] uppercase mb-1">
              Panel administrativo
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Pagos confirmados — histórico
            </h1>
          </div>

          <button
            onClick={() => cargarPagos({ silencioso: true })}
            disabled={refrescando || cargando}
            className="h-10 px-4 rounded-xl text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <RefreshCw size={15} className={refrescando ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-4xl">
          <TarjetaMetrica
            icono={<CircleCheck size={13} />}
            etiqueta="Pagos confirmados"
            valor={metricas.totalPagos}
          />
          <TarjetaMetrica
            icono={<Wallet size={13} />}
            etiqueta="Monto total"
            valor={metricas.totalMonto.toLocaleString("es-CO") + " COP"}
          />
          <TarjetaMetrica
            icono={<TrendingUp size={13} />}
            etiqueta="Ticket promedio"
            valor={Math.round(metricas.promedio).toLocaleString("es-CO") + " COP"}
          />
          <TarjetaMetrica
            icono={<Users size={13} />}
            etiqueta="Usuarios únicos"
            valor={metricas.usuariosUnicos}
          />
        </div>

        {Object.keys(metricas.porPlan).length > 0 && (
          <div
            className="rounded-2xl p-5 mb-8"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <p className="text-white/40 text-xs tracking-wide uppercase mb-4">
              Desglose por plan
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(metricas.porPlan).map(([plan, datos]) => (
                <div
                  key={plan}
                  className="rounded-xl px-4 py-3 flex-1 min-w-[160px]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-white/80 text-sm font-medium capitalize mb-1">{plan}</p>
                  <p className="text-white text-lg font-semibold">
                    {datos.monto.toLocaleString("es-CO")} <span className="text-xs text-white/40">COP</span>
                  </p>
                  <p className="text-white/40 text-xs">{datos.cantidad} pagos</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm text-white/90"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por correo o referencia..."
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
            />
          </div>
          <select
            value={filtroPlan}
            onChange={(e) => setFiltroPlan(e.target.value)}
            className="h-10 px-4 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {planesDisponibles.map((plan) => (
              <option key={plan} value={plan} style={{ background: "#0a0a0a" }}>
                {plan === "todos" ? "Todos los planes" : plan}
              </option>
            ))}
          </select>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {cargando ? (
            <div className="p-10 space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                />
              ))}
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <CircleCheck size={20} className="text-white/60" strokeWidth={1.5} />
              </div>
              <p className="text-white/70 text-sm">
                {pagos.length === 0
                  ? "No hay pagos confirmados todavía."
                  : "Ningún pago coincide con el filtro."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Usuario</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Plan</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Monto</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Medio</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Correo pagador</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Referencia</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Comprobante</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosFiltrados.map((pago) => {
                    const tieneComprobante = Boolean(pago.comprobante);
                    const urlComprobante = tieneComprobante ? PANEL_BASE_URL + pago.comprobante : null;

                    return (
                      <tr
                        key={pago.id}
                        className="transition-colors hover:bg-white/[0.03]"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <td className="px-5 py-4 text-white">{pago.usuario_email}</td>
                        <td className="px-5 py-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium text-white/80"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                          >
                            {pago.plan}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-white font-medium">
                          {Number(pago.monto).toLocaleString("es-CO")} {pago.moneda}
                        </td>
                        <td className="px-5 py-4 text-white/70 capitalize">{pago.medio_pago}</td>
                        <td className="px-5 py-4 text-white/70">{pago.correo_pagador}</td>
                        <td className="px-5 py-4 text-white/50 font-mono text-xs">{pago.referencia_interna}</td>
                        <td className="px-5 py-4">
                          {urlComprobante ? (
                            <a
                              href={urlComprobante}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                            >
                              <FileText size={14} />
                              Ver
                            </a>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-white/50 whitespace-nowrap">
                          {new Date(pago.fecha_creacion).toLocaleString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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