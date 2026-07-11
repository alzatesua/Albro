// MapaSection.jsx — migrado a Leaflet + OpenStreetMap
import { useEffect, useRef, useState } from "react";
import { Search, CalendarClock } from "lucide-react";
import Toast from "../../components/Toast";
import ModalBuscarServicio from "./ModalBuscarServicio";
import { getUbicacionesProfesionales, buscarProfesionales } from "../../services/api";

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

const getMediaBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8006/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

// Genera un pin con la foto de perfil (o iniciales) recortada en círculo dentro de la cabeza
// Genera un pin con la foto de perfil (o iniciales) recortada en círculo dentro de la cabeza
const crearAvatarPinIcon = ({ imagenUrl, iniciales, id, seleccionado = false }) => {
  const clipId = `clip-prof-${id}`;
  const tamano = seleccionado ? 64 : 52;
  const alto = seleccionado ? 84 : 68;
  const colorFondo = seleccionado ? "#ffffff" : "#18181b";

  return {
    className: "",
    html: `
      <div class="${seleccionado ? "animate__animated animate__bounce" : ""}">
        <svg width="${tamano}" height="${alto}" viewBox="0 0 52 68" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="${clipId}">
              <circle cx="26" cy="26" r="22"/>
            </clipPath>
          </defs>
          <path d="M26 0C11.64 0 0 11.64 0 26c0 17.875 26 42.25 26 42.25s26-24.375 26-42.25C52 11.64 40.36 0 26 0z" fill="${colorFondo}" stroke="${seleccionado ? "#18181b" : "none"}" stroke-width="${seleccionado ? 1.5 : 0}"/>
          ${
            imagenUrl
              ? `<image href="${imagenUrl}" x="4" y="4" width="44" height="44" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
              : `<circle cx="26" cy="26" r="22" fill="${colorFondo}"/>
                 <text x="26" y="31" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="15" fill="${seleccionado ? "#18181b" : "#ffffff"}">${iniciales}</text>`
          }
        </svg>
      </div>
    `,
    iconSize: [tamano, alto],
    iconAnchor: [tamano / 2, alto],
    popupAnchor: [0, -alto],
  };
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

  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);
  const marcadoresProfesionalesRef = useRef({}); // antes era []
  const [profesionalSeleccionadoId, setProfesionalSeleccionadoId] = useState(null);
  const [profesionalParaAgendar, setProfesionalParaAgendar] = useState(null);
  

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

          // Escucha clicks en los botones "Agendar" de los popups (delegación de eventos)
          map.on('popupopen', (e) => {
            const boton = e.popup.getElement()?.querySelector('.btn-agendar-popup');
            if (boton) {
              boton.addEventListener('click', () => {
                const profesionalId = boton.dataset.profesionalId;
                const entry = marcadoresProfesionalesRef.current[profesionalId];
                if (entry) {
                  setProfesionalParaAgendar(entry.prof);
                }
                setModalAbierto(true);
              });
            }
          });
  
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

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Si el campo está vacío, vuelve a mostrar todos los profesionales
    if (!textoBusqueda.trim()) {
      setResultadosBusqueda([]);
      getUbicacionesProfesionales()
        .then((data) => pintarMarcadores(data.profesionales))
        .catch((err) => console.error("Error recargando ubicaciones:", err));
      return;
    }

    setBuscando(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await buscarProfesionales({ q: textoBusqueda.trim() });

        // Deduplica por id como red de seguridad adicional
        const vistos = new Set();
        const profesionalesUnicos = (data.profesionales || []).filter((p) => {
          if (vistos.has(p.id)) return false;
          vistos.add(p.id);
          return true;
        });

        setResultadosBusqueda(profesionalesUnicos);
        await pintarMarcadores(profesionalesUnicos);
      } catch (err) {
        console.error("Error buscando profesionales:", err);
        mostrarToast("No se pudo completar la búsqueda", "error");
      } finally {
        setBuscando(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [textoBusqueda, estado.listo]);

  useEffect(() => {
    if (!estado.listo || !mapInstanceRef.current) return;

    let cancelado = false;

    const cargarProfesionales = async () => {
      try {
        const data = await getUbicacionesProfesionales();
        if (cancelado) return;
        await pintarMarcadores(data.profesionales);
      } catch (err) {
        console.error("Error cargando ubicaciones de profesionales:", err);
      }
    };

    cargarProfesionales();

    return () => {
      cancelado = true;
    };
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

  const pintarMarcadores = async (profesionales) => {
    if (!mapInstanceRef.current) return;

    const L = (await import("leaflet")).default;
    const mediaBaseUrl = getMediaBaseUrl();

    // Limpia marcadores previos
    Object.values(marcadoresProfesionalesRef.current).forEach((entry) => entry.marker.remove());
    marcadoresProfesionalesRef.current = {};

    (profesionales || []).forEach((prof, index) => {
      const lat = parseFloat(prof.latitud);
      const lng = parseFloat(prof.longitud);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const id = prof.id ?? index;
      const iniciales = `${prof.nombre?.[0] || ""}${prof.apellido?.[0] || ""}`.toUpperCase();
      const imagenUrl = prof.imagen_perfil ? `${mediaBaseUrl}${prof.imagen_perfil}` : null;
      const esSeleccionado = id === profesionalSeleccionadoId;

      const avatarPinIcon = L.divIcon(
        crearAvatarPinIcon({ imagenUrl, iniciales, id, seleccionado: esSeleccionado })
      );
      const marker = L.marker([lat, lng], { icon: avatarPinIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family:sans-serif;padding:4px 8px;font-size:13px;color:#18181b">
            <strong>${prof.nombre} ${prof.apellido}</strong>
            <button
              class="btn-agendar-popup"
              data-profesional-id="${prof.id}"
              style="
                display:block;
                margin-top:8px;
                width:100%;
                background:#18181b;
                color:#fff;
                border:none;
                border-radius:9999px;
                padding:6px 12px;
                font-size:12px;
                font-weight:500;
                cursor:pointer;
              "
            >
              Agendar cita
            </button>
          </div>
        `);

      // Guarda el marker JUNTO con los datos crudos para poder regenerar el ícono luego
      marcadoresProfesionalesRef.current[id] = { marker, prof, iniciales, imagenUrl };
    });
  };
  const irAProfesional = async (prof) => {
    const lat = parseFloat(prof.latitud);
    const lng = parseFloat(prof.longitud);
    if (Number.isNaN(lat) || Number.isNaN(lng) || !mapInstanceRef.current) return;

    const L = (await import("leaflet")).default;

    // Restaura el ícono normal del que estaba seleccionado antes
    if (profesionalSeleccionadoId != null) {
      const anterior = marcadoresProfesionalesRef.current[profesionalSeleccionadoId];
      if (anterior) {
        anterior.marker.setIcon(
          L.divIcon(
            crearAvatarPinIcon({
              imagenUrl: anterior.imagenUrl,
              iniciales: anterior.iniciales,
              id: profesionalSeleccionadoId,
              seleccionado: false,
            })
          )
        );
      }
    }

    // Resalta el nuevo seleccionado
    const actual = marcadoresProfesionalesRef.current[prof.id];
    if (actual) {
      actual.marker.setIcon(
        L.divIcon(
          crearAvatarPinIcon({
            imagenUrl: actual.imagenUrl,
            iniciales: actual.iniciales,
            id: prof.id,
            seleccionado: true,
          })
        )
      );
      actual.marker.openPopup();
    }

    setProfesionalSeleccionadoId(prof.id);
    mapInstanceRef.current.setView([lat, lng], 17, { animate: true });

    setResultadosBusqueda([]);
    setTextoBusqueda("");
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
        >
          <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-3 flex items-center gap-2.5 shadow-lg">
            <Search size={17} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <input
              type="text"
              value={textoBusqueda}
              onChange={(e) => setTextoBusqueda(e.target.value)}
              placeholder="Buscar profesionales, servicios o categorías"
              className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
            {buscando && (
              <span className="text-xs text-zinc-400 shrink-0 animate-pulse">buscando…</span>
            )}
          </div>

          {resultadosBusqueda.length > 0 && (
            <div className="mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {resultadosBusqueda.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => irAProfesional(prof)}
                  className="w-full text-left px-4 py-2.5 flex flex-col hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-b border-zinc-100 dark:border-zinc-700 last:border-b-0"
                >
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {prof.nombre} {prof.apellido}
                  </span>
                  {prof.direccion && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{prof.direccion}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {!buscando && textoBusqueda.trim() && resultadosBusqueda.length === 0 && (
            <div className="mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-lg px-4 py-3">
              <span className="text-sm text-zinc-400">Sin resultados para "{textoBusqueda}"</span>
            </div>
          )}
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
          onClose={() => {
            setModalAbierto(false);
            setProfesionalParaAgendar(null);
          }}
          onBuscar={handleBuscar}
          profesionalPreseleccionado={profesionalParaAgendar}
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