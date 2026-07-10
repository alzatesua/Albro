import { useEffect, useRef, useState } from "react";
import { X, MapPin, Check, Search } from "lucide-react";
import "animate.css";

const ZOOM_DEFAULT = 16;
const ZOOM_BUSQUEDA = 14;
const CENTRO_DEFECTO = { lat: 4.5709, lng: -74.2973 }; // Colombia, centro aproximado

// SVG de pin negro
const PIN_SVG = `
<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="#18181b"/>
  <circle cx="16" cy="16" r="6" fill="#ffffff"/>
</svg>
`;

const crearIconoNegro = () => ({
  className: "",
  html: `<div class="pin-wrapper animate__animated animate__rubberBand">${PIN_SVG}</div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42], // la punta del pin coincide con el punto exacto
  popupAnchor: [0, -42],
});

// Reinicia la animación quitando y volviendo a poner la clase (forzando reflow)
const reanimarPin = (markerElement) => {
  if (!markerElement) return;
  const wrapper = markerElement.querySelector(".pin-wrapper");
  if (!wrapper) return;
  wrapper.classList.remove("animate__animated", "animate__rubberBand");
  void wrapper.offsetWidth; // fuerza reflow para reiniciar la animación
  wrapper.classList.add("animate__animated", "animate__rubberBand");
};

// Geocodificación inversa: coordenadas -> texto de dirección legible
const geocodificarInverso = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "es" },
    });
    const data = await res.json();
    return data.display_name || null;
  } catch (err) {
    console.error("Error en geocodificación inversa:", err);
    return null;
  }
};

// Búsqueda directa: texto (departamento/municipio/dirección) -> lista de lugares en Colombia
const buscarLugares = async (texto) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      texto
    )}&format=json&addressdetails=1&countrycodes=co&limit=6`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "es" },
    });
    return await res.json();
  } catch (err) {
    console.error("Error buscando lugar:", err);
    return [];
  }
};

const ModalUbicacionMapa = ({ latInicial, lngInicial, onConfirmar, onCerrar }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const actualizarPosicionRef = useRef(null);

  const [coords, setCoords] = useState(null); // { lat, lng }
  const [direccionTexto, setDireccionTexto] = useState("");
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);

  // Buscador de departamento/municipio
  const [busquedaTexto, setBusquedaTexto] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoLugar, setBuscandoLugar] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  useEffect(() => {
    const iniciar = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const centro = latInicial && lngInicial
        ? { lat: parseFloat(latInicial), lng: parseFloat(lngInicial) }
        : CENTRO_DEFECTO;

      const map = L.map(mapRef.current, {
        center: [centro.lat, centro.lng],
        zoom: ZOOM_DEFAULT,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const iconoNegro = L.divIcon(crearIconoNegro());

      const marker = L.marker([centro.lat, centro.lng], {
        draggable: true,
        icon: iconoNegro,
      }).addTo(map);

      const actualizarPosicion = (lat, lng) => {
        setCoords({ lat, lng });
        setBuscandoDireccion(true);
        geocodificarInverso(lat, lng).then((direccion) => {
          setDireccionTexto(direccion || "");
          setBuscandoDireccion(false);
        });
      };
      actualizarPosicionRef.current = actualizarPosicion;

      // Al soltar el pin
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        actualizarPosicion(pos.lat, pos.lng);
        reanimarPin(marker.getElement());
      });

      // Al hacer clic en cualquier punto del mapa, mueve el pin ahí
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        actualizarPosicion(e.latlng.lat, e.latlng.lng);
        reanimarPin(marker.getElement());
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Carga la dirección inicial del punto de partida
      actualizarPosicion(centro.lat, centro.lng);
    };

    iniciar();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce del buscador: espera 450ms sin escribir antes de consultar Nominatim
  useEffect(() => {
    if (busquedaTexto.trim().length < 3) {
      setResultadosBusqueda([]);
      setBuscandoLugar(false);
      return;
    }

    setBuscandoLugar(true);
    const timeout = setTimeout(async () => {
      const resultados = await buscarLugares(busquedaTexto);
      setResultadosBusqueda(resultados);
      setMostrarResultados(true);
      setBuscandoLugar(false);
    }, 450);

    return () => clearTimeout(timeout);
  }, [busquedaTexto]);

  // Salta el mapa al lugar elegido y mueve el pin ahí
  const handleSeleccionarResultado = (resultado) => {
    const lat = parseFloat(resultado.lat);
    const lng = parseFloat(resultado.lon);
    if (!mapInstanceRef.current || !markerRef.current || Number.isNaN(lat) || Number.isNaN(lng)) return;

    mapInstanceRef.current.setView([lat, lng], ZOOM_BUSQUEDA);
    markerRef.current.setLatLng([lat, lng]);
    reanimarPin(markerRef.current.getElement());
    actualizarPosicionRef.current?.(lat, lng);

    setBusquedaTexto("");
    setResultadosBusqueda([]);
    setMostrarResultados(false);
  };

  const handleConfirmar = () => {
    if (!coords) return;
    if (typeof onConfirmar !== "function") {
      console.error("ModalUbicacionMapa: falta la prop onConfirmar", { onConfirmar });
      return;
    }
    onConfirmar({
      latitud: Number(coords.lat.toFixed(6)),
      longitud: Number(coords.lng.toFixed(6)),
      direccion: direccionTexto,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-zinc-500 dark:text-zinc-400" />
            <span className="font-semibold text-zinc-900 dark:text-white">Fija la ubicación exacta de tu local</span>
          </div>
          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mapa */}
        <div className="relative">
          {/* Buscador de departamento/municipio */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                onFocus={() => resultadosBusqueda.length > 0 && setMostrarResultados(true)}
                onBlur={() => setTimeout(() => setMostrarResultados(false), 150)}
                placeholder="Buscar departamento o municipio..."
                className="w-full pl-8 pr-3 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
              />
              {buscandoLugar && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400">...</span>
              )}
            </div>

            {mostrarResultados && resultadosBusqueda.length > 0 && (
              <div className="mt-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                {resultadosBusqueda.map((r) => (
                  <button
                    key={r.place_id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // evita que el blur cierre antes del click
                    onClick={() => handleSeleccionarResultado(r)}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={mapRef} style={{ width: "100%", height: "380px" }} />
          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full shadow">
            Arrastra el pin o toca el mapa para ubicar tu local
          </p>
        </div>

        {/* Dirección detectada */}
        <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Dirección detectada</p>
            <p className="text-sm text-zinc-800 dark:text-zinc-100 min-h-[20px]">
              {buscandoDireccion ? "Buscando dirección..." : (direccionTexto || "—")}
            </p>
            {coords && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCerrar}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!coords || buscandoDireccion}
              className="flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={14} />
              Usar esta ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalUbicacionMapa;