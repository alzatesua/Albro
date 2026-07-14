import { useState, useEffect, useRef, useCallback } from "react";
import { ImagePlus, X, Upload, Loader2, Camera, SwitchCamera, Aperture } from "lucide-react";
import { subirImagenesPortafolio, actualizarConfiguracionSwitches } from "../services/api"; // ajusta la ruta

const LS_KEY = "ocultarModalPortafolio";

const ModalSubirPortafolio = ({ cita, visible, onCerrar }) => {
  const [archivos, setArchivos] = useState([]); // [{ file, previewUrl }]
  const [descripcion, setDescripcion] = useState("");
  const [noVolverMostrar, setNoVolverMostrar] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // ── Estado de la cámara en vivo ──────────────────────────────────────
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [erroCamara, setErrorCamara] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Reset del estado interno cada vez que se abre para una cita nueva
  useEffect(() => {
    if (visible) {
      setArchivos([]);
      setDescripcion("");
      setNoVolverMostrar(false);
      setError("");
      setCamaraAbierta(false);
    }
  }, [visible, cita?.id]);

  // Libera los object URLs al desmontar o al reemplazar archivos
  useEffect(() => {
    return () => archivos.forEach((a) => URL.revokeObjectURL(a.previewUrl));
  }, [archivos]);

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCamaraAbierta(false);
  }, []);

  const iniciarCamara = useCallback(async (modo = facingMode) => {
    setErrorCamara("");
    // Si ya hay un stream abierto (por ejemplo al cambiar de cámara), lo cerramos primero
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: modo },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamaraAbierta(true);
    } catch (err) {
      console.error("Error al abrir la cámara:", err);
      setErrorCamara(
        "No se pudo acceder a la cámara. Revisa los permisos del navegador."
      );
      setCamaraAbierta(false);
    }
  }, [facingMode]);

  // Apaga la cámara si el modal se cierra mientras estaba abierta
  useEffect(() => {
    if (!visible) detenerCamara();
    return () => detenerCamara();
  }, [visible, detenerCamara]);

  if (!visible || !cita) return null;

  const agregarArchivos = (fileList) => {
    const nuevos = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setArchivos((prev) => [...prev, ...nuevos]);
  };

  const quitarArchivo = (index) => {
    setArchivos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(blob);
        setArchivos((prev) => [...prev, { file, previewUrl }]);
      },
      "image/jpeg",
      0.9
    );
  };

  const cambiarCamara = () => {
    const nuevoModo = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nuevoModo);
    iniciarCamara(nuevoModo);
  };

  const cerrarYGuardarPreferencia = async () => {
    if (noVolverMostrar) {
        try {
        await actualizarConfiguracionSwitches({ mostrar_modal_portafolio: false });
        } catch (err) {
        console.error("No se pudo guardar la preferencia:", err);
        }
    }
    onCerrar();
    };

  const handleSubir = async () => {
    if (archivos.length === 0) {
      cerrarYGuardarPreferencia();
      return;
    }
    try {
      setSubiendo(true);
      setError("");
      await subirImagenesPortafolio(
        archivos.map((a) => a.file),
        { citaId: cita.id, descripcion }
      );
      cerrarYGuardarPreferencia();
    } catch (err) {
      setError(err.message || "No se pudieron subir las imágenes.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-4.5 h-4.5 text-emerald-500" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            ¡Cita completada!
          </h3>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          ¿Quieres subir fotos del trabajo con{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            {cita.usuario_nombre}
          </span>{" "}
          a tu portafolio?
        </p>

        {/* ── Vista de cámara en vivo ────────────────────────────────── */}
        {camaraAbierta ? (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover"
            />

            {/* Botón cerrar cámara */}
            <button
              onClick={detenerCamara}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cambiar cámara frontal/trasera */}
            <button
              onClick={cambiarCamara}
              className="absolute top-2 left-2 bg-black/50 rounded-full p-1.5 text-white hover:bg-black/70 transition-colors"
              title="Cambiar cámara"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            {/* Botón de captura */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <button
                onClick={capturarFoto}
                className="w-14 h-14 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
              >
                <Aperture className="w-7 h-7 text-zinc-800" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Botón: abrir cámara */}
            <button
              onClick={() => iniciarCamara()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-3.5 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <Camera className="w-4.5 h-4.5" />
              Tomar foto con la cámara
            </button>

            {/* Botón: elegir desde galería/archivos */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                agregarArchivos(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-5 text-sm text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-500 transition-colors"
            >
              <ImagePlus className="w-6 h-6" />
              O elegir desde tus archivos
            </button>
          </div>
        )}

        {erroCamara && <p className="text-sm text-red-500 mt-2">{erroCamara}</p>}

        {/* Miniaturas */}
        {archivos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {archivos.map((a, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                <img src={a.previewUrl} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => quitarArchivo(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Descripción opcional */}
        {archivos.length > 0 && (
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full mt-3 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        )}

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        {/* Switch: no volver a mostrar */}
        <label className="flex items-center justify-between gap-3 mt-5 cursor-pointer select-none">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            No volver a mostrar este mensaje
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={noVolverMostrar}
            onClick={() => setNoVolverMostrar((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
              noVolverMostrar ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                noVolverMostrar ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        {/* Acciones */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={cerrarYGuardarPreferencia}
            disabled={subiendo}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Omitir
          </button>
          <button
            onClick={handleSubir}
            disabled={subiendo}
            className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {subiendo ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {subiendo
              ? "Subiendo..."
              : archivos.length === 0
              ? "Cerrar"
              : `Subir ${archivos.length} foto${archivos.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSubirPortafolio;