import { useState, useEffect } from "react";
import { getPagosPendientesAdmin, confirmarPagoPendienteAdmin } from "@/services/api";
import { useAuthAdmin } from "@/context/AuthContextAdmin";
import {
  LogOut,
  RefreshCw,
  FileText,
  Loader2,
  CircleCheck,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";

const PANEL_BASE_URL = import.meta.env.VITE_API_URL_PANEL || "http://localhost:8006";

export default function PagosPendientesPage() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState("");
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [pagoAConfirmar, setPagoAConfirmar] = useState(null);
  const [pagoConfirmadoOk, setPagoConfirmadoOk] = useState(null);
  const { limpiarSesionAdmin } = useAuthAdmin();

  const cargarPagos = async ({ silencioso = false } = {}) => {
    if (silencioso) {
      setRefrescando(true);
    } else {
      setCargando(true);
    }
    setError("");
    try {
      const data = await getPagosPendientesAdmin();
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

  const manejarConfirmar = async () => {
    if (!pagoAConfirmar) return;
    const pagoId = pagoAConfirmar.id;
    setConfirmandoId(pagoId);
    setError("");
    try {
      await confirmarPagoPendienteAdmin(pagoId);
      setPagos((prev) => prev.filter((p) => p.id !== pagoId));
      setPagoConfirmadoOk(pagoAConfirmar.referencia_interna);
      setTimeout(() => setPagoConfirmadoOk(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmandoId(null);
      setPagoAConfirmar(null);
    }
  };

  const totalMonto = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/35 text-[11px] tracking-[0.25em] uppercase mb-1">
              Panel administrativo
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Pagos pendientes por verificar
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => cargarPagos({ silencioso: true })}
              disabled={refrescando || cargando}
              className="h-10 px-4 rounded-xl text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <RefreshCw size={15} className={refrescando ? "animate-spin" : ""} />
              Actualizar
            </button>
            <button
              onClick={limpiarSesionAdmin}
              className="h-10 px-4 rounded-xl text-sm font-medium text-white/70 hover:text-white flex items-center gap-2 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div className="flex items-center gap-2 text-white/40 text-xs tracking-wide uppercase mb-2">
              <Clock size={13} />
              Pagos pendientes
            </div>
            <p className="text-3xl font-semibold text-white">{pagos.length}</p>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div className="text-white/40 text-xs tracking-wide uppercase mb-2">
              Monto total pendiente
            </div>
            <p className="text-3xl font-semibold text-white">
              {totalMonto.toLocaleString("es-CO")} <span className="text-base text-white/40">COP</span>
            </p>
          </div>
        </div>

        {pagoConfirmadoOk && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <CircleCheck size={16} />
            Pago <span className="font-medium">{pagoConfirmadoOk}</span> confirmado — membresía activada y factura enviada.
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
          ) : pagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <CircleCheck size={20} className="text-white/60" strokeWidth={1.5} />
              </div>
              <p className="text-white/70 text-sm">No hay pagos pendientes por verificar.</p>
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
                    <th className="text-left px-5 py-3 text-white/40 text-xs tracking-wide uppercase font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => {
                    const tieneComprobante = Boolean(pago.comprobante);
                    const urlComprobante = tieneComprobante
                      ? PANEL_BASE_URL + pago.comprobante
                      : null;

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
                          {tieneComprobante ? (
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
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setPagoAConfirmar(pago)}
                            disabled={confirmandoId === pago.id}
                            className="h-9 px-4 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
                            style={{ background: "rgba(255,255,255,0.95)", color: "#0a0a0a" }}
                          >
                            {confirmandoId === pago.id ? (
                              <span className="flex items-center gap-1.5">
                                <Loader2 size={13} className="animate-spin" />
                                Confirmando
                              </span>
                            ) : (
                              "Confirmar pago"
                            )}
                          </button>
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

      {pagoAConfirmar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setPagoAConfirmar(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Confirmar pago</h3>
              <button
                onClick={() => setPagoAConfirmar(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-white/60 text-sm mb-1">{pagoAConfirmar.usuario_email}</p>
            <p className="text-white text-2xl font-semibold mb-4">
              {Number(pagoAConfirmar.monto).toLocaleString("es-CO")} {pagoAConfirmar.moneda}
            </p>

            <p className="text-white/50 text-sm mb-6">
              Se marcará el pago como exitoso, se activará la membresía y se enviará la factura al correo del usuario. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setPagoAConfirmar(null)}
                className="flex-1 h-10 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                Cancelar
              </button>
              <button
                onClick={manejarConfirmar}
                disabled={confirmandoId !== null}
                className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
                style={{ background: "rgba(255,255,255,0.95)", color: "#0a0a0a" }}
              >
                {confirmandoId !== null ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Confirmando...
                  </span>
                ) : (
                  "Sí, confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}