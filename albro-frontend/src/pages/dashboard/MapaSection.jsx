import { useEffect, useRef, useState } from "react";
import { getGeocodingApiKey } from "@/services/api";

const ZOOM_DEFAULT = 15;

const MapaSection = () => {
  const mapRef = useRef(null);
  const [estado, setEstado] = useState({ cargando: true, error: null, listo: false });

  useEffect(() => {
    const apiKey = getGeocodingApiKey();

    if (!apiKey) {
      setEstado({ cargando: false, error: "API key no configurada. Agrega VITE_GOOGLE_GEOCODING_API_KEY en tu .env", listo: false });
      return;
    }

    const callbackName = "__albro_maps_ready__";

    const iniciarMapa = () => {
      if (!navigator.geolocation) {
        setEstado({ cargando: false, error: "Tu navegador no soporta geolocalización.", listo: false });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;

          if (!mapRef.current) return;

          const { Map } = await window.google.maps.importLibrary("maps");
          const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");

          const map = new Map(mapRef.current, {
            center: { lat, lng },
            zoom: ZOOM_DEFAULT,
            mapId: "albro_map",
            streetViewControl: false,
            mapTypeControl: false,
          });

          const pin = document.createElement("div");
          pin.style.cssText = `
            width: 18px; height: 18px;
            border-radius: 50%;
            background: #18181b;
            border: 3px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          `;

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat, lng },
            title: "Tu ubicación",
            content: pin,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="font-family:sans-serif;padding:4px 8px;font-size:13px;color:#18181b">
                <strong>📍 Estás aquí</strong><br/>
                <span style="color:#71717a">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
              </div>
            `,
          });

          marker.addEventListener("gmp-click", () => infoWindow.open(map, marker));

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

    if (window.google?.maps) {
      iniciarMapa();
      return;
    }

    window[callbackName] = iniciarMapa;

    if (!document.getElementById("google-maps-script")) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=marker&callback=${callbackName}`;
      script.async = true;
      script.onerror = () =>
        setEstado({ cargando: false, error: "Error al cargar Google Maps. Verifica tu API key.", listo: false });
      document.head.appendChild(script);
    }

    return () => {
      delete window[callbackName];
    };
  }, []);

  const reintentar = () => {
    setEstado({ cargando: true, error: null, listo: false });
    const existing = document.getElementById("google-maps-script");
    if (existing) existing.remove();
    window.google = undefined;
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Mapa</h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          Encuentra profesionales cerca de ti
        </p>
      </div>

      {/* Contenedor con altura fija — Google Maps requiere alto explícito en píxeles */}
      <div style={{ position: "relative", height: "480px" }}>

        {/* Cargando */}
        {estado.cargando && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10 }}
            className="flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-900 rounded-b-2xl">
            <span className="text-4xl animate-pulse">🗺️</span>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Obteniendo tu ubicación…</p>
          </div>
        )}

        {/* Error */}
        {!estado.cargando && estado.error && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10 }}
            className="flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900 px-6 text-center rounded-b-2xl">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs leading-relaxed">
              {estado.error}
            </p>
            <button
              onClick={reintentar}
              className="text-xs px-4 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Div del mapa — width y height en style inline, no Tailwind */}
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

export default MapaSection;