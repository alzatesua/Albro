import { useState, useEffect } from "react";
import { X, Copy, Check, Download, QrCode } from "lucide-react";
import Portal from "@/components/ui/Portal";
import { getMiCodigoQR } from "@/services/api";

const ModalCodigoQR = ({ abierto, onClose }) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    setCargando(true);
    setError(null);
    setData(null);
    setCopiado(false);

    getMiCodigoQR()
      .then(setData)
      .catch((err) => {
        console.error("Error generando código QR:", err);
        setError(err.message || "No se pudo generar el código QR.");
      })
      .finally(() => setCargando(false));
  }, [abierto]);

  const copiarLink = async () => {
    if (!data?.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Error copiando el link:", err);
    }
  };

  const descargarQR = () => {
    if (!data?.qr_base64) return;
    const a = document.createElement("a");
    a.href = data.qr_base64;
    a.download = "mi-codigo-qr.png";
    a.click();
  };

  if (!abierto) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate__animated animate__fadeIn animate__faster"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-sm overflow-hidden animate__animated animate__zoomIn animate__faster"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <QrCode size={16} className="text-zinc-400" />
              Mi código QR
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contenido */}
          <div className="px-5 py-5 flex flex-col items-center gap-4">
            {cargando ? (
              <div className="py-10 text-sm text-zinc-400 dark:text-zinc-500">
                Generando código QR...
              </div>
            ) : error ? (
              <div className="py-10 text-sm text-red-500 text-center">{error}</div>
            ) : (
              <>
                <div className="p-3 bg-white rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <img src={data.qr_base64} alt="Código QR" className="w-48 h-48" />
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                  Los clientes que escaneen este código llegarán directo a agendar contigo.
                </p>

                <div className="w-full flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                  <span className="flex-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {data.url}
                  </span>
                  <button
                    onClick={copiarLink}
                    className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    {copiado ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>
                </div>

                <button
                  onClick={descargarQR}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 hover:opacity-90 transition-opacity"
                >
                  <Download size={15} />
                  Descargar QR
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ModalCodigoQR;