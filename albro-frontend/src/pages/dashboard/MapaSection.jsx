// MapaSection.jsx — migrado a Leaflet + OpenStreetMap
import { useEffect, useRef, useState } from "react";
import { Search, CalendarClock } from "lucide-react";
import Toast from "../../components/Toast";
import ModalBuscarServicio from "./ModalBuscarServicio";

const ZOOM_DEFAULT = 15;


// Fix para el ícono default de Leaflet con Vite/webpack
const fixLeafletIcons = () => {
  import("leaflet").then((L) => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  });
};

// ─── Mapa principal ─────────────────────────────────────────────────────────
const MapaSection = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // evita doble init en StrictMode
  const [estado, setEstado] = useState({ cargando: true, error: null, listo: false });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [animarAgendar, setAnimarAgendar] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const mostrarToast = (mensaje, tipo = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ mensaje, tipo, key: Date.now() });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const cerrarToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  };

  useEffect(() => {
    // Evita reinicializar si ya existe instancia
    if (mapInstanceRef.current) return;

    fixLeafletIcons();

    const iniciarMapa = async () => {
      if (!navigator.geolocation) {
        setEstado({ cargando: false, error: "Tu navegador no soporta geolocalización.", listo: false });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude: lat, longitude: lng } }) => {
          if (!mapRef.current) return;

          const L = (await import("leaflet")).default;
          await import("leaflet/dist/leaflet.css");

          const map = L.map(mapRef.current, {
            center: [lat, lng],
            zoom: ZOOM_DEFAULT,
            zoomControl: true,
          });

          // Tiles de OpenStreetMap
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(map);

          // Marcador personalizado tipo avatar (tu ubicación)
          const tuUbicacionIcon = L.divIcon({
            className: "",
            html: `
              <div style="
                width: 18px; height: 18px;
                border-radius: 50%;
                background: #18181b;
                border: 3px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          L.marker([lat, lng], { icon: tuUbicacionIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:sans-serif;padding:4px 8px;font-size:13px;color:#18181b">
                <strong>📍 Estás aquí</strong><br/>
                <span style="color:#71717a">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
              </div>
            `);

          mapInstanceRef.current = map;
          setEstado({ cargando: false, error: null, listo: true });
        },
        (err) => {
          const mensajes = {
            1: "Permiso de ubicación denegado. Habilítalo en la configuración del navegador.",
            2: "No se pudo obtener tu ubicación actual.",
            3: "La solicitud tardó demasiado. Inténtalo de nuevo.",
          };
          setEstado({ cargando: false, error: mensajes[err.code] || "Error de geolocalización.", listo: false });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    iniciarMapa();

    return () => {
      // Cleanup al desmontar
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!estado.listo) return;

    const intervalo = setInterval(() => {
      setAnimarAgendar(true);
      // Quita la clase después de que termine la animación (rubberBand dura ~1s)
      setTimeout(() => setAnimarAgendar(false), 1000);
    }, 8000);

    return () => clearInterval(intervalo);
  }, [estado.listo]);

  const reintentar = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setEstado({ cargando: true, error: null, listo: false });
  };

  const handleBuscar = ({ categoriaSel, servicioSel, precio }) => {
    // TODO: conectar con backend para filtrar profesionales en el mapa
    console.log("Buscar profesionales con:", { categoriaSel, servicioSel, precio });
    setModalAbierto(false);
  };



  return (
    <div style={{ position: "fixed", inset: 0, top: "var(--header-height, 65px)", bottom: "0px", zIndex: 1 }}>
      <Toast toast={toast} onClose={cerrarToast} />
      {estado.cargando && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}
          className="flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-900">
          <span className="text-4xl animate-pulse">🗺️</span>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Obteniendo tu ubicación…</p>
        </div>
      )}
      {!estado.cargando && estado.error && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}
          className="flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900 px-6 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs leading-relaxed">{estado.error}</p>
          <button onClick={reintentar}
            className="text-xs px-4 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 transition-opacity">
            Reintentar
          </button>
        </div>
      )}

      {/* Barra de búsqueda flotante centrada */}
      {estado.listo && (
        <div
          style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: "min(90%, 480px)", zIndex: 20 }}
          className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-3 flex items-center gap-2.5 shadow-lg"
        >
          <Search size={17} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          <input
            type="text"
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
            placeholder="Buscar profesionales, servicios o categorías"
            className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      )}

      {/* Botón Agendar flotante */}
      {estado.listo && (
        <button
          onClick={() => setModalAbierto(true)}
          style={{ position: "absolute", top: 16, right: 16, zIndex: 20, whiteSpace: "nowrap" }}
          className={`bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 border-2 border-black ${
            animarAgendar ? "animate__animated animate__rubberBand" : ""
          }`}
        >
          <CalendarClock size={15} />
          Agendar
        </button>
      )}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%", position: "relative", zIndex: 0 }}
      />

      {modalAbierto && (
        <ModalBuscarServicio
          onClose={() => setModalAbierto(false)}
          onBuscar={handleBuscar}
          onNotificar={(notificacion) => {
            if (!notificacion) return cerrarToast();
            mostrarToast(notificacion.mensaje, notificacion.tipo);
          }}
        />
      )}
    </div>
  );
};

export default MapaSection;