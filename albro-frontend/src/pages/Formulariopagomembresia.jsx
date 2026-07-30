import { useState } from "react";
import { Link } from "react-router";
import {
  Shield, ChevronLeft, Lock, CheckCircle2, Upload, Loader2, AlertCircle,
} from "lucide-react";
import fondoLogin from "@/assets/fondo-login.jpg";
import qrNequi from "@/assets/qr-nequi.png";
import qrLlave from "@/assets/qr-llave.png";

// ─── Datos de planes y medios de pago ──────────────────────────────────────
// Ajusta precios, datos de cuenta y las imágenes de QR a las reales de Albro.
const PLANES = [
  { id: "mensual", nombre: "Mensual", precio: 30000, detalle: "Se renueva cada mes" },
  { id: "anual", nombre: "Anual", precio: 300000, detalle: "Equivale a 2 meses gratis" },
];

const MEDIOS_PAGO = [
  { id: "nequi", nombre: "Nequi", numero: "3127540816", qr: qrNequi },
  { id: "llave", nombre: "Llave", numero: "@oeq056", qr: qrLlave },
];

const formatoCOP = (valor) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);

// ─── Formulario ─────────────────────────────────────────────────────────────
export default function FormularioPagoMembresia() {
  const [plan, setPlan] = useState("mensual");
  const [medioPago, setMedioPago] = useState("");
  const [correoPagador, setCorreoPagador] = useState("");
  const [emailCuenta, setEmailCuenta] = useState("");   // ← mover aquí, antes de usarla
  const [comprobante, setComprobante] = useState(null);
  const [estado, setEstado] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const planActivo = PLANES.find((p) => p.id === plan);
  const medioActivo = MEDIOS_PAGO.find((m) => m.id === medioPago);
  const formularioValido =
  plan && medioPago && correoPagador.trim().length > 3 && emailCuenta.trim().length > 3;
  const [referencia, setReferencia] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    if (!formularioValido) return;
    setEstado("enviando");
    setErrorMsg("");

    try {
      const body = new FormData();
        body.append("plan", plan);
        body.append("medio_pago", medioPago);
        body.append("correo_pagador", correoPagador);
        body.append("email_cuenta", emailCuenta);   // ← nueva línea
        body.append("monto", planActivo.precio);
        if (comprobante) body.append("comprobante", comprobante);

      const res = await fetch("/api/servicios/membresia/pagar/", {
        method: "POST",
        body,
     });

     if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detalle || "No se pudo registrar el pago. Intenta de nuevo.");
    }

    const data = await res.json();
    setReferencia(data?.pago?.referencia_interna || "");
    setEstado("ok");
    } catch (err) {
      setEstado("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .font-body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 grayscale"
          style={{ backgroundImage: `url(${fondoLogin})`, filter: "blur(6px) saturate(0%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/92 via-black/88 to-black" />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 26px)" }}
        />

        <div className="relative z-10">
          <header className="w-full px-6 py-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
                <Shield className="text-white" size={18} />
              </div>
              <div>
                <p className="text-white font-display font-medium text-base tracking-tight">Albro</p>
                <p className="text-white/45 font-body text-xs">Activar membresía</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm font-body text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
              Volver
            </Link>
          </header>

          <section className="w-full px-6 pt-10 pb-16 text-center">
            <div className="max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-body font-medium text-white bg-white/10 border border-white/30">
                <Lock size={11} />
                Pago verificado manualmente
              </span>
              <h1 className="mt-6 text-3xl sm:text-[2.6rem] font-display font-medium text-white tracking-tight leading-[1.1]">
                Activa tu membresía
                <span className="block text-white/70">Nequi o Llave, en tres pasos</span>
              </h1>
              <p className="mt-4 text-white/50 font-body text-sm sm:text-[15px] leading-relaxed">
                Elige tu plan, transfiere al medio de pago indicado y cuéntanos desde qué correo lo
                hiciste para poder confirmar tu pago.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ── FORMULARIO ── */}
      <div className="w-full max-w-2xl mx-auto px-6 -mt-8 pb-24 relative z-10">
        <form
          onSubmit={enviar}
          className="rounded-2xl bg-white border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(0,0,0,0.15)] px-6 sm:px-12 py-10 sm:py-14"
        >
          <div className="divide-y divide-black/[0.06]">

            {/* Sección 1 — Plan */}
            <section className="py-8 first:pt-0">
              <div className="flex items-start gap-4 mb-5">
                <span className="font-display text-3xl sm:text-4xl text-black/10 leading-none select-none shrink-0">1</span>
                <h2 className="text-lg sm:text-xl font-display font-medium text-[#1B1E27] tracking-tight pt-1">
                  Elige tu plan
                </h2>
              </div>

              <div className="pl-0 sm:pl-[3.25rem] grid sm:grid-cols-2 gap-3">
                {PLANES.map((p) => {
                  const activo = plan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id)}
                      className={`text-left rounded-xl border px-5 py-4 transition-colors ${
                        activo ? "border-black bg-black text-white" : "border-black/15 hover:border-black/30 text-[#1B1E27]"
                      }`}
                    >
                      <p className="font-display text-base font-medium">{p.nombre}</p>
                      <p className={`font-body text-xl font-medium mt-1 ${activo ? "text-white" : "text-[#1B1E27]"}`}>
                        {formatoCOP(p.precio)}
                      </p>
                      <p className={`font-body text-xs mt-1 ${activo ? "text-white/60" : "text-black/45"}`}>
                        {p.detalle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Sección 2 — Medio de pago */}
            <section className="py-8">
              <div className="flex items-start gap-4 mb-5">
                <span className="font-display text-3xl sm:text-4xl text-black/10 leading-none select-none shrink-0">2</span>
                <h2 className="text-lg sm:text-xl font-display font-medium text-[#1B1E27] tracking-tight pt-1">
                  Elige el medio de pago
                </h2>
              </div>

              <div className="pl-0 sm:pl-[3.25rem] grid sm:grid-cols-2 gap-3">
                {MEDIOS_PAGO.map((m) => {
                  const activo = medioPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMedioPago(m.id)}
                      className={`text-left rounded-xl border px-5 py-4 transition-colors ${
                        activo ? "border-black bg-black text-white" : "border-black/15 hover:border-black/30 text-[#1B1E27]"
                      }`}
                    >
                      <p className="font-display text-base font-medium">{m.nombre}</p>
                      <p className={`font-body text-sm mt-1 ${activo ? "text-white/70" : "text-black/45"}`}>
                        {m.numero}
                      </p>
                    </button>
                  );
                })}
              </div>

              {medioActivo && (
                <div className="pl-0 sm:pl-[3.25rem] mt-5">
                  <div className="flex flex-col items-center text-center rounded-xl border border-black/10 bg-[#F7F4EC] px-6 py-6">
                    <img
                      src={medioActivo.qr}
                      alt={`Código QR para pagar con ${medioActivo.nombre}`}
                      className="size-64 sm:size-80 rounded-lg border border-black/10 bg-white p-3 object-contain"
                    />
                    <p className="mt-4 text-sm font-body text-black/60 leading-relaxed max-w-xs">
                      Escanea el código o transfiere{" "}
                      <span className="text-[#1B1E27] font-medium">{formatoCOP(planActivo.precio)}</span> a{" "}
                      <span className="text-[#1B1E27] font-medium">{medioActivo.nombre} · {medioActivo.numero}</span>
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Sección 3 — Datos de contacto */}
            <section className="py-8">
              <div className="flex items-start gap-4 mb-5">
                <span className="font-display text-3xl sm:text-4xl text-black/10 leading-none select-none shrink-0">3</span>
                <h2 className="text-lg sm:text-xl font-display font-medium text-[#1B1E27] tracking-tight pt-1">
                  Cuéntanos quién pagó
                </h2>
              </div>

              <div className="pl-0 sm:pl-[3.25rem] space-y-4">
                <div>
                    <label htmlFor="correo_pagador" className="block text-xs font-body font-medium text-black/60 mb-1.5">
                        Correo desde el que hiciste la transferencia
                    </label>
                    <input
                        id="correo_pagador"
                        type="email"
                        required
                        value={correoPagador}
                        onChange={(e) => setCorreoPagador(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full rounded-lg border border-black/15 px-4 py-2.5 text-sm font-body text-[#1B1E27] placeholder:text-black/30 focus:outline-none focus:border-black transition-colors"
                    />
                </div>

                <div>
                  <label htmlFor="comprobante" className="block text-xs font-body font-medium text-black/60 mb-1.5">
                    Comprobante de pago (opcional)
                  </label>
                  <label
                    htmlFor="comprobante"
                    className="flex items-center gap-2 rounded-lg border border-dashed border-black/20 px-4 py-3 text-sm font-body text-black/50 cursor-pointer hover:border-black/40 transition-colors"
                  >
                    <Upload size={15} />
                    {comprobante ? comprobante.name : "Subir imagen o PDF del comprobante"}
                  </label>
                  <input
                    id="comprobante"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Feedback */}
          {estado === "error" && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-black/[0.04] border border-black/10 px-4 py-3 text-sm font-body text-[#1B1E27]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {estado === "ok" ? (
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-black text-white px-5 py-4">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <div>
                    <p className="font-display text-sm font-medium">Solicitud registrada</p>
                    <p className="font-body text-xs text-white/60 mt-1">
                        Vamos a verificar tu pago y activaremos tu membresía en cuanto lo confirmemos.
                    </p>
                    {referencia && (
                        <p className="font-body text-xs text-white/80 mt-2">
                        Referencia: <span className="font-medium">{referencia}</span>
                        </p>
                    )}
                    </div>
                </div>
          ) : (
            <button
              type="submit"
              disabled={!formularioValido || estado === "enviando"}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-black text-white font-body text-sm font-medium py-3 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/85 transition-colors"
            >
              {estado === "enviando" && <Loader2 size={15} className="animate-spin" />}
              {estado === "enviando" ? "Enviando..." : "Registrar pago"}
            </button>
          )}

          <p className="mt-4 text-center text-xs font-body text-black/35">
            Tu membresía se activa una vez verifiquemos manualmente el comprobante y el medio de pago.
          </p>
        </form>
      </div>

      {/* Botón flotante de WhatsApp */}
      <a
        href="https://wa.me/573127540816"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:bg-[#20bd5a] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-7">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.58 1.36 5.07L2 22l5.25-1.38a9.85 9.85 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 1.67c4.55 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.55 3.7-8.24 8.24-8.24Zm-4.52 4.6c-.16 0-.42.06-.64.31-.22.25-.85.83-.85 2.02s.87 2.35.99 2.51c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.44-1.34-1.68-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42h-.47Z" />
        </svg>
      </a>
    </div>
  );
}