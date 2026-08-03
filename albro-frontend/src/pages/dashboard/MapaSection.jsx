// MapaSection.jsx — migrado a Leaflet + OpenStreetMap
import { useEffect, useRef, useState } from "react";
import { Search, CalendarClock } from "lucide-react";
import Toast from "../../components/Toast";
import ModalBuscarServicio from "./ModalBuscarServicio";
import ModalCatalogoProfesional from "../../components/ModalCatalogoProfesional";
import { getUbicacionesProfesionales, buscarProfesionales, getCatalogoProfesional } from "../../services/api";


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


const COLOR_ESTADO = {
  disponible: "#43c522",     // verde
  no_disponible: "#f81414",  // gris
  en_almuerzo: "#ff6f08",    // naranja
  en_break: "#eab308",       // amarillo
};
const colorPorEstado = (codigo) => COLOR_ESTADO[codigo] || "#a1a1aa";

// Genera un pin con la foto de perfil (o iniciales) recortada en círculo dentro de la cabeza,
// más un puntico de color arriba a la derecha indicando el estado de atención
const crearAvatarPinIcon = ({ imagenUrl, iniciales, id, seleccionado = false, estadoCodigo }) => {
  const clipId = `clip-prof-${id}`;
  const tamano = seleccionado ? 64 : 52;
  const alto = seleccionado ? 84 : 68;
  const colorFondo = seleccionado ? "#ffffff" : "#18181b";
  const colorEstado = colorPorEstado(estadoCodigo);

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
          <circle cx="42" cy="10" r="7" fill="${colorEstado}" stroke="#ffffff" stroke-width="2.5"/>
        </svg>
      </div>
    `,
    iconSize: [tamano, alto],
    iconAnchor: [tamano / 2, alto],
    popupAnchor: [0, -alto],
  };
};

// ─── Mapa principal ─────────────────────────────────────────────────────────
const MapaSection = ({ profesionalIdInicial, onConsumirProfesionalInicial, onAbrirChat }) => {
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
  const ZOOM_DEFAULT = 15;
  const ZOOM_PAIS = 6; // zoom inicial mientras no sabemos la ubicación del cliente
  const CENTRO_DEFECTO = { lat: 4.5709, lng: -74.2973 }; // Colombia, centro aproximado
  const hoverTimeoutRef = useRef(null);
  const profesionalesPorIdRef = useRef({}); 
  

  const mostrarToast = (mensaje, tipo = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ mensaje, tipo, key: Date.now() });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
  };

  const cerrarToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  };

  // ── Modal de catálogo público ──────────────────────────────────────────
  const [catalogoAbierto, setCatalogoAbierto] = useState(null); // profesional crudo
  const [catalogoData, setCatalogoData] = useState(null);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState(null);

  const abrirCatalogo = async (prof) => {
    setCatalogoAbierto(prof);
    setCatalogoData(null);
    setErrorCatalogo(null);
    setCargandoCatalogo(true);
    try {
      const data = await getCatalogoProfesional(prof.id);
      setCatalogoData(data);
    } catch (err) {
      console.error("Error cargando catálogo público:", err);
      setErrorCatalogo(err.message || "No se pudo cargar el catálogo.");
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const cerrarCatalogo = () => {
    setCatalogoAbierto(null);
    setCatalogoData(null);
    setErrorCatalogo(null);
  };
    

  useEffect(() => {
    // Evita reinicializar si ya existe instancia
    if (mapInstanceRef.current) return;

    fixLeafletIcons();

    const iniciarMapa = async () => {
      if (!mapRef.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // El mapa se crea YA, con un centro por defecto — no espera al navegador
      const map = L.map(mapRef.current, {
        center: [CENTRO_DEFECTO.lat, CENTRO_DEFECTO.lng],
        zoom: ZOOM_PAIS,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);



      mapInstanceRef.current = map;

      // El mapa ya está listo para mostrarse, sin importar lo que pase con la geolocalización
      setEstado({ cargando: false, error: null, listo: true });

      // Pide la ubicación del cliente EN PARALELO, sin bloquear el mapa.
      // Si acepta: lo centramos ahí y le ponemos su pin.
      // Si rechaza, falla, o el navegador no soporta geolocalización: no pasa nada, el mapa se queda como está.
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude: lat, longitude: lng } }) => {
            if (!mapInstanceRef.current) return;

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
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div style="font-family:sans-serif;padding:4px 8px;font-size:13px;color:#18181b">
                  <strong>📍 Estás aquí</strong><br/>
                  <span style="color:#71717a">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
                </div>
              `);

            mapInstanceRef.current.flyTo([lat, lng], ZOOM_DEFAULT, { animate: true });
          },
          (err) => {
            // Silencioso: el mapa ya está visible, solo no lo centramos en el cliente.
            console.warn("No se pudo obtener la ubicación del cliente:", err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
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




  const claveGrupo = (profesionales) =>
  profesionales.map((p) => p.id).sort((a, b) => a - b).join("-");

    // Distancia en metros entre dos coordenadas (fórmula de Haversine)
  const distanciaMetros = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // radio de la Tierra en metros
    const rad = (x) => (x * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Radio dentro del cual dos profesionales se consideran "el mismo local"
  // Radio dentro del cual dos profesionales se consideran "el mismo local"
const RADIO_AGRUPACION_METROS = Number(import.meta.env.VITE_RADIO_AGRUPACION_METROS) || 25;

  const agruparPorUbicacion = (profesionales) => {
    const puntos = (profesionales || [])
      .map((prof) => {
        const lat = parseFloat(prof.latitud);
        const lng = parseFloat(prof.longitud);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { lat, lng, prof };
      })
      .filter(Boolean);

    const grupos = [];

    puntos.forEach(({ lat, lng, prof }) => {
      // Busca un grupo existente cuyo centro esté a menos de RADIO_AGRUPACION_METROS
      const grupoExistente = grupos.find(
        (g) => distanciaMetros(g.lat, g.lng, lat, lng) <= RADIO_AGRUPACION_METROS
      );

      if (grupoExistente) {
        grupoExistente.profesionales.push(prof);
        // Recalcula el centro del grupo como el promedio (para que no "se corra" con cada nuevo miembro)
        const n = grupoExistente.profesionales.length;
        grupoExistente.lat = grupoExistente.lat + (lat - grupoExistente.lat) / n;
        grupoExistente.lng = grupoExistente.lng + (lng - grupoExistente.lng) / n;
      } else {
        grupos.push({ lat, lng, profesionales: [prof] });
      }
    });

    return grupos;
  };

  const crearAvatarGrupoIcon = ({ profesionales, mediaBaseUrl, seleccionado = false }) => {
    const visibles = profesionales.slice(0, 3);
    const restantes = profesionales.length - visibles.length;

    const avatarSize = seleccionado ? 54 : 46; // más grandes que antes (eran ~24-26px)
    const gap = 6;       // separación entre avatares
    const padding = 8;   // margen interno de la cápsula

    const totalItems = visibles.length + (restantes > 0 ? 1 : 0);
    const anchoContenido = totalItems * avatarSize + (totalItems - 1) * gap;
    const anchoTotal = anchoContenido + padding * 2;
    const altoBurbuja = avatarSize + padding * 2;
    const alturaTotal = altoBurbuja + 9; // + puntero triangular de abajo

    const avatarHtml = (p) => {
      const imagenUrl = p.imagen_perfil ? `${mediaBaseUrl}${p.imagen_perfil}` : null;
      const iniciales = `${p.nombre?.[0] || ""}${p.apellido?.[0] || ""}`.toUpperCase();
      const colorEstado = colorPorEstado(p.estado?.codigo);
      return `
        <div class="avatar-item" data-profesional-id="${p.id}" style="
          position:relative;
          width:${avatarSize}px;height:${avatarSize}px;
          border-radius:50%;
          background:${imagenUrl ? `url('${imagenUrl}') center/cover no-repeat` : "#3f3f46"};
          border:2px solid #fff;
          box-shadow:0 1px 3px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
          flex-shrink:0;
        ">
          ${!imagenUrl ? `<span style="color:#fff;font-family:sans-serif;font-weight:600;font-size:${Math.round(avatarSize * 0.36)}px">${iniciales}</span>` : ""}
          <span style="
            position:absolute; top:-2px; right:-2px;
            width:13px;height:13px;border-radius:50%;
            background:${colorEstado};
            border:2px solid #fff;
          "></span>
        </div>
      `;
    };

    const masHtml = restantes > 0 ? `
      <div class="avatar-mas" style="
        width:${avatarSize}px;height:${avatarSize}px;
        border-radius:50%;
        background:#3f3f46;
        border:2px solid #fff;
        box-shadow:0 1px 3px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;
        flex-shrink:0;
        color:#fff;font-family:sans-serif;font-weight:700;font-size:${Math.round(avatarSize * 0.3)}px;
      ">+${restantes}</div>
    ` : "";

    return {
      className: "",
      html: `
        <div class="${seleccionado ? "animate__animated animate__bounce" : ""}" style="position:relative;width:${anchoTotal}px;">
          <div style="
            display:flex;align-items:center;gap:${gap}px;
            background:#18181b;
            border-radius:9999px;
            padding:${padding}px;
            box-shadow:0 4px 12px rgba(0,0,0,0.32);
          ">
            ${visibles.map(avatarHtml).join("")}
            ${masHtml}
          </div>
          <div style="
            position:absolute; left:50%; bottom:-8px; transform:translateX(-50%);
            width:0;height:0;
            border-left:8px solid transparent;
            border-right:8px solid transparent;
            border-top:9px solid #18181b;
          "></div>
        </div>
      `,
      iconSize: [anchoTotal, alturaTotal],
      iconAnchor: [anchoTotal / 2, alturaTotal],
      popupAnchor: [0, -alturaTotal],
    };
  };


  const reintentarUbicacion = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        mapInstanceRef.current.flyTo([lat, lng], ZOOM_DEFAULT, { animate: true });
      },
      (err) => console.warn("No se pudo obtener la ubicación:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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

  // ── Deep link desde QR: abre el modal de agendar con el profesional ya cargado ──
  useEffect(() => {
    if (!profesionalIdInicial || !estado.listo) return;

    const cargarYAbrir = async () => {
      try {
        const data = await getCatalogoProfesional(profesionalIdInicial);
        const p = data.profesional;
        const partesNombre = (p.nombre_completo || p.nombre_local || "").split(" ");

        setProfesionalParaAgendar({
          id: p.id,
          nombre: partesNombre[0] || p.nombre_local,
          apellido: partesNombre.slice(1).join(" "),
          direccion: p.direccion,
          latitud: p.latitud,
          longitud: p.longitud,
          estado: p.estado,
        });
        setModalAbierto(true);
      } catch (err) {
        console.error("No se pudo cargar el profesional del QR:", err);
        mostrarToast("No se pudo abrir la cita de ese profesional", "error");
      } finally {
        onConsumirProfesionalInicial?.();
      }
    };

    cargarYAbrir();
  }, [profesionalIdInicial, estado.listo]);

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

    Object.values(marcadoresProfesionalesRef.current).forEach((entry) => entry.marker.remove());
    marcadoresProfesionalesRef.current = {};
    profesionalesPorIdRef.current = {};

    const grupos = agruparPorUbicacion(profesionales);

    // ── Fila HTML para un solo profesional dentro de cualquier popup ──
    const filaProfesional = (prof) => {
      const noDisponible = prof.estado?.codigo === "no_disponible";
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0">
          <div style="min-width:0">
            <strong style="font-size:13px">${prof.nombre} ${prof.apellido}</strong><br/>
            <span style="color:${colorPorEstado(prof.estado?.codigo)};font-weight:600;font-size:11px">
              ${prof.estado?.nombre || "Sin estado"}
            </span>
          </div>
          <div style="display:flex;gap:4px;shrink:0">
            <button class="btn-catalogo-popup" data-profesional-id="${prof.id}"
              style="background:#fff;color:#18181b;border:1px solid #d4d4d8;border-radius:9999px;padding:5px 9px;font-size:11px;cursor:pointer;white-space:nowrap">
              Catálogo
            </button>
            <button class="btn-agendar-popup" data-profesional-id="${prof.id}" ${noDisponible ? "disabled" : ""}
              style="background:${noDisponible ? "#e4e4e7" : "#18181b"};color:${noDisponible ? "#a1a1aa" : "#fff"};border:none;border-radius:9999px;padding:5px 9px;font-size:11px;cursor:${noDisponible ? "not-allowed" : "pointer"};white-space:nowrap">
              Agendar
            </button>
            <button class="btn-mensaje-popup" data-profesional-id="${prof.id}"
              style="background:#fff;color:#18181b;border:1px solid #d4d4d8;border-radius:9999px;padding:5px 9px;font-size:11px;cursor:pointer;white-space:nowrap">
              Chat
            </button>
          </div>
        </div>
      `;
    };

    // ── Conecta los botones de acción del contenido actual del popup ──
    const conectarBotones = (popupEl) => {
      if (!popupEl) return;

      popupEl.querySelectorAll(".btn-agendar-popup").forEach((boton) => {
        boton.addEventListener("click", () => {
          const id = boton.dataset.profesionalId;
          const entry = profesionalesPorIdRef.current[id];
          if (!entry) return;
          if (entry.estadoCodigo === "no_disponible") {
            mostrarToast("Este profesional no está disponible en este momento", "error");
            return;
          }
          setProfesionalParaAgendar(entry.prof);
          setModalAbierto(true);
        });
      });

      popupEl.querySelectorAll(".btn-catalogo-popup").forEach((boton) => {
        boton.addEventListener("click", () => {
          const id = boton.dataset.profesionalId;
          const entry = profesionalesPorIdRef.current[id];
          if (entry) abrirCatalogo(entry.prof);
        });
      });

      popupEl.querySelectorAll(".btn-mensaje-popup").forEach((boton) => {
        boton.addEventListener("click", () => {
          const id = boton.dataset.profesionalId;
          const entry = profesionalesPorIdRef.current[id];
          if (entry) onAbrirChat?.(entry.prof);
        });
      });
    };

    // ── Engancha hover/click a cada avatar individual dentro de un pin de grupo ──
    const attachAvatarListeners = (marker, profsDelGrupo) => {
      const el = marker.getElement();
      if (!el) return;

      const programarCierre = () => {
        hoverTimeoutRef.current = setTimeout(() => marker.closePopup(), 250);
      };

      const abrirPopupDe = (html) => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        marker.setPopupContent(html);
        marker.openPopup();
      };

      const htmlDe = (prof) => `
        <div class="popup-profesional" style="font-family:sans-serif;padding:4px 8px;font-size:13px;color:#18181b;min-width:190px">
          ${filaProfesional(prof)}
        </div>
      `;

      const htmlCompleto = `
        <div class="popup-profesional" style="font-family:sans-serif;padding:4px 8px;font-size:13px;color:#18181b;max-height:260px;overflow-y:auto;min-width:230px">
          <strong style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.03em">
            ${profsDelGrupo.length} profesionales en este local
          </strong>
          ${profsDelGrupo.map(filaProfesional).join("")}
        </div>
      `;

      // Resuelve qué se debe abrir según el nodo tocado/clickeado
      const resolverYAbrir = (nodo) => {
        const avatarNodo = nodo.closest?.(".avatar-item");
        if (avatarNodo) {
          const id = avatarNodo.getAttribute("data-profesional-id");
          const prof = profsDelGrupo.find((p) => String(p.id) === String(id));
          if (prof) abrirPopupDe(htmlDe(prof));
          return true;
        }
        const masNodo = nodo.closest?.(".avatar-mas");
        if (masNodo) {
          abrirPopupDe(htmlCompleto);
          return true;
        }
        return false;
      };

      // ── Delegación a nivel del ícono completo (funciona igual en mouse y táctil) ──

      // Desktop: hover sobre cada avatar
      el.addEventListener("mouseover", (e) => {
        resolverYAbrir(e.target);
      });
      el.addEventListener("mouseout", (e) => {
        // Solo programa cierre si el mouse realmente salió del ícono completo
        if (!el.contains(e.relatedTarget)) {
          programarCierre();
        }
      });

      // Táctil y click universal: usamos touchend + click, evitando el doble disparo
      let manejadoPorTouch = false;

      el.addEventListener(
        "touchend",
        (e) => {
          const abierto = resolverYAbrir(e.target);
          if (abierto) {
            manejadoPorTouch = true;
            e.preventDefault(); // evita el "click fantasma" posterior en móviles
            e.stopPropagation();
            // Resetea la bandera poco después para no bloquear futuros clicks reales
            setTimeout(() => { manejadoPorTouch = false; }, 400);
          }
        },
        { passive: false }
      );

      el.addEventListener("click", (e) => {
        if (manejadoPorTouch) return; // ya se manejó por touchend, evita doble apertura/cierre
        const abierto = resolverYAbrir(e.target);
        if (abierto) e.stopPropagation();
      });
    };

    grupos.forEach((grupo) => {
      const { lat, lng, profesionales: profsDelGrupo } = grupo;
      const esGrupo = profsDelGrupo.length > 1;
      const groupKey = claveGrupo(profsDelGrupo);

      profsDelGrupo.forEach((p) => {
        profesionalesPorIdRef.current[p.id] = { prof: p, estadoCodigo: p.estado?.codigo };
      });

      const icon = esGrupo
        ? L.divIcon(crearAvatarGrupoIcon({ profesionales: profsDelGrupo, mediaBaseUrl }))
        : L.divIcon(
            crearAvatarPinIcon({
              imagenUrl: profsDelGrupo[0].imagen_perfil ? `${mediaBaseUrl}${profsDelGrupo[0].imagen_perfil}` : null,
              iniciales: `${profsDelGrupo[0].nombre?.[0] || ""}${profsDelGrupo[0].apellido?.[0] || ""}`.toUpperCase(),
              id: profsDelGrupo[0].id,
              seleccionado: profsDelGrupo[0].id === profesionalSeleccionadoId,
              estadoCodigo: profsDelGrupo[0].estado?.codigo,
            })
          );

      const marker = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);

      if (esGrupo) {
        // El contenido se rellena dinámicamente según qué avatar se hover/clickee
        marker.bindPopup("", { closeButton: false, autoPan: false });
        attachAvatarListeners(marker, profsDelGrupo);
      } else {
        const popupHtml = `
          <div class="popup-profesional" style="font-family:sans-serif;padding:4px 8px;font-size:13px;color:#18181b;min-width:190px">
            ${filaProfesional(profsDelGrupo[0])}
          </div>
        `;
        marker.bindPopup(popupHtml, { closeButton: false, autoPan: false });

        // Desktop: hover abre/cierra el popup
        marker.on("mouseover", () => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          marker.openPopup();
        });
        marker.on("mouseout", () => {
          hoverTimeoutRef.current = setTimeout(() => marker.closePopup(), 250);
        });

        // Táctil: touchend abre el popup y evita el click fantasma posterior
        const el = marker.getElement();
        if (el) {
          let manejadoPorTouch = false;

          el.addEventListener(
            "touchend",
            (e) => {
              e.preventDefault();
              e.stopPropagation();
              manejadoPorTouch = true;
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
              marker.openPopup();
              setTimeout(() => { manejadoPorTouch = false; }, 400);
            },
            { passive: false }
          );

          el.addEventListener("click", (e) => {
            if (manejadoPorTouch) {
              e.stopPropagation();
              return;
            }
            marker.openPopup();
          });
        }
      }

      // Común a ambos: mantener el popup abierto si el mouse entra a él,
      // y conectar los botones de acción cada vez que se abre.
      marker.on("popupopen", (e) => {
        const popupEl = e.popup.getElement();
        if (!popupEl) return;

        popupEl.addEventListener("mouseenter", () => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
        });
        popupEl.addEventListener("mouseleave", () => {
          hoverTimeoutRef.current = setTimeout(() => marker.closePopup(), 250);
        });

        conectarBotones(popupEl);
      });

      marcadoresProfesionalesRef.current[groupKey] = {
        marker,
        profesionales: profsDelGrupo,
        esGrupo,
      };
    });
  };
  const irAProfesional = async (prof) => {
    const lat = parseFloat(prof.latitud);
    const lng = parseFloat(prof.longitud);
    if (Number.isNaN(lat) || Number.isNaN(lng) || !mapInstanceRef.current) return;

    // Busca, entre todos los grupos pintados, cuál contiene a este profesional
    const entry = Object.values(marcadoresProfesionalesRef.current).find((e) =>
      e.profesionales.some((p) => p.id === prof.id)
    );

    setProfesionalSeleccionadoId(prof.id);
    mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
    entry?.marker.openPopup();

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

      <ModalCatalogoProfesional
        profesional={catalogoAbierto}
        catalogo={catalogoData}
        cargando={cargandoCatalogo}
        error={errorCatalogo}
        onClose={cerrarCatalogo}
        onAgendar={(prof) => {
          setProfesionalParaAgendar(prof);
          setModalAbierto(true);
          cerrarCatalogo();
        }}
      />
    </div>
  );
};

export default MapaSection;