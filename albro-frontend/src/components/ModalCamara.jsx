import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Check, Camera, SwitchCamera } from "lucide-react";
import Portal from "@/components/ui/Portal";

const ModalCamara = ({ abierto, onClose, onCapturar }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [foto, setFoto] = useState(null); // dataURL del snapshot, null = viendo cámara en vivo
  const [error, setError] = useState(null);
  const [modoFrontal, setModoFrontal] = useState(false);
  const [tieneMultiplesCamaras, setTieneMultiplesCamaras] = useState(false);

  const detenerStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const iniciarCamara = async (frontal = modoFrontal) => {
    setError(null);
    detenerStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: frontal ? "user" : "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accediendo a la cámara:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Necesitas dar permiso de cámara para usar esta función."
          : "No se pudo acceder a la cámara."
      );
    }
  };

  useEffect(() => {
    if (!abierto) return;

    setFoto(null);
    iniciarCamara(modoFrontal);

    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        const camaras = devices.filter((d) => d.kind === "videoinput");
        setTieneMultiplesCamaras(camaras.length > 1);
      })
      .catch(() => {});

    return () => detenerStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!abierto) return null;

  const capturarFoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setFoto(canvas.toDataURL("image/jpeg", 0.9));
    detenerStream();
  };

  const repetirFoto = () => {
    setFoto(null);
    iniciarCamara(modoFrontal);
  };

  const confirmarFoto = () => {
    fetch(foto)
      .then((res) => res.blob())
      .then((blob) => {
        const archivo = new File([blob], `foto-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapturar(archivo);
        cerrar();
      });
  };

  const cambiarCamara = () => {
    const nuevoModo = !modoFrontal;
    setModoFrontal(nuevoModo);
    iniciarCamara(nuevoModo);
  };

  const cerrar = () => {
    detenerStream();
    setFoto(null);
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate__animated animate__fadeIn animate__faster">
        <div className="bg-zinc-900 rounded-2xl overflow-hidden w-full max-w-md">
          <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800">
            <span className="text-sm font-medium text-white">Tomar foto</span>
            <button
              onClick={cerrar}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative aspect-square bg-black flex items-center justify-center">
            {error ? (
              <p className="text-sm text-red-400 text-center px-6">{error}</p>
            ) : foto ? (
              <img src={foto} alt="Foto capturada" className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {!foto && !error && tieneMultiplesCamaras && (
              <button
                onClick={cambiarCamara}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <SwitchCamera size={16} />
              </button>
            )}
          </div>

          <div className="px-4 py-4 flex items-center justify-center gap-4">
            {foto ? (
              <>
                <button
                  onClick={repetirFoto}
                  className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium flex items-center gap-1.5 hover:bg-zinc-800 transition-colors"
                >
                  <RotateCcw size={14} />
                  Repetir
                </button>
                <button
                  onClick={confirmarFoto}
                  className="px-4 py-2 rounded-full bg-white text-zinc-900 text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <Check size={14} />
                  Usar foto
                </button>
              </>
            ) : (
              <button
                onClick={capturarFoto}
                disabled={!!error}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center disabled:opacity-30"
              >
                <Camera size={20} className="text-zinc-900" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ModalCamara;