const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8006/api";

// Helper para headers con token
const authHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper genérico para peticiones
const request = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: authHeaders(),
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/login';
    } else {
      const mensaje =
        data?.detail ||
        data?.detalle ||
        data?.message ||
        Object.entries(data)
          .map(([campo, errs]) => {
            const texto = Array.isArray(errs) ? errs.join(", ") : errs;
            return campo === "non_field_errors" ? texto : `${campo}: ${texto}`;
          })
          .join(" · ");

      const err = new Error(mensaje);
      err.status = res.status;
      err.requierePago = data?.requiere_pago === true; // ← nuevo
      throw err;
    }
  }

  return data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginUsuario = (email, password) =>
  request("/usuarios/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });


export const loginConGoogle = (code) =>         
  request("/usuarios/google-login", {
    method: "POST",
    body: JSON.stringify({ code }),
  });


export const registrarUsuario = (datosUsuario) =>
  request("/usuarios/registro/", {
    method: "POST",
    body: JSON.stringify(datosUsuario),
  });

// ─── Profesionales ────────────────────────────────────────────────────────────

export const getPerfilProfesional = () =>
  request("/profesionales/perfil/");

export const getDepartamentos = () =>
  request("/profesionales/departamentos/");

export const getEstadosProfesional = () =>
  request("/profesionales/estados/");

export const getEstadoProfesional = () =>
  request("/profesionales/estado/");

export const actualizarEstadoProfesional = (estadoId) =>
  request("/profesionales/estado/", {
    method: "PATCH",
    body: JSON.stringify({ estado_id: estadoId }),
  });

export const getMunicipios = (departamentoId) =>
  request(`/profesionales/departamentos/${departamentoId}/municipios/`);

export const registrarProfesional = (datos) =>
  request("/profesionales/registro/", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const actualizarImagenPerfil = (archivo) => {
  const formData = new FormData();
  formData.append("imagen_perfil", archivo);

  return requestFormData("/profesionales/perfil/", formData, {
    method: "PATCH",
  });
};

export const actualizarDatosPersonales = (datos) =>
  request("/profesionales/perfil/", {
    method: "PATCH",
    body: JSON.stringify(datos),
  });

// ─── Horarios de atención ───────────────────────────────────────────────────
export const actualizarMisHorarios = (horarios) =>
  request("/profesionales/mis-horarios/", {
    method: "PUT",
    body: JSON.stringify(horarios),
  });


// Helper para peticiones con FormData (uploads de archivos)
const requestFormData = async (endpoint, formData, options = {}) => {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      // OJO: NO poner "Content-Type" aquí, el navegador debe
      // setearlo automáticamente con el boundary correcto
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/login';
    } else {
      const mensaje =
        data?.detail ||
        data?.detalle ||
        data?.message ||
        Object.entries(data)
          .map(([campo, errs]) => {
            const texto = Array.isArray(errs) ? errs.join(", ") : errs;
            return campo === "non_field_errors" ? texto : `${campo}: ${texto}`;
          })
          .join(" · ");

      const err = new Error(mensaje);
      err.status = res.status;
      throw err;
    }
  }

  return data;
};



export const getGeocodingApiKey = () =>
  import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY || "";


// ─── Servicios ────────────────────────────────────────────────────────────────

export const getCategorias = () =>
  request("/servicios/categorias/");

export const getServiciosPorCategoria = (categoriaId) =>
  request(`/servicios/servicios/?categoria=${categoriaId}`);

export const getMisServicios = () =>
  request("/servicios/mis-servicios/");

export const eliminarServicio = (servicioId) =>
  request(`/servicios/mis-servicios/?servicio_id=${servicioId}`, {
    method: "DELETE",
  });

// ─── Profesionales ────────────────────────────────────────────────────────────────
export const getProfesionalesPorServicio = (servicioId) =>
  request(`/servicios/profesionales/?servicio=${servicioId}`);


// ─── Agendas ────────────────────────────────────────────────────────────────
export const getAgendaProfesional = (profesionalId, servicioId, fecha) =>
  request(`/profesionales/${profesionalId}/agenda/?servicio=${servicioId}&fecha=${fecha}`);



// ─── Citas ────────────────────────────────────────────────────────────────

export const crearCita = (payload) =>
  request("/citas/", {
    method: "POST",
    body: JSON.stringify(payload),
  });


export const getCitas = ({ estado, page, page_size } = {}) => {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  if (page) params.set("page", page);
  if (page_size) params.set("page_size", page_size);

  const query = params.toString();
  return request(`/citas/${query ? `?${query}` : ""}`);
};


export const confirmarCita = (citaId) =>
  request(`/citas/${citaId}/confirmar/`, {
    method: "POST",
  });

  
export const completarCita = (citaId) =>
  request(`/citas/${citaId}/completar/`, {
    method: "POST",
  });

export const reagendarCita = async (citaId, { fecha, hora_inicio, hora_fin }) => {
  const data = await request(`/citas/${citaId}/reagendar/`, {
    method: "POST",
    body: JSON.stringify({ fecha, hora: hora_inicio, hora_inicio, hora_fin }),
  });
  return data.cita ?? data;
};

// ─── Notificaciones ──────────────────────────────────────────────────────

export const getNotificaciones = ({ leida, page, page_size } = {}) => {
  const params = new URLSearchParams();
  if (leida !== undefined) params.set("leida", leida);
  if (page) params.set("page", page);
  if (page_size) params.set("page_size", page_size);

  const query = params.toString();
  return request(`/notificaciones/${query ? `?${query}` : ""}`);
};

export const marcarNotificacionLeida = (notificacionId) =>
  request(`/notificaciones/${notificacionId}/marcar-leida/`, {
    method: "POST",
  });

export const marcarTodasNotificacionesLeidas = () =>
  request(`/notificaciones/marcar-todas-leidas/`, {
    method: "POST",
  });
// ─── Servicios (crear) ─────────────────────────────────────────────────────
export const agregarServicio = ({ servicio_id, precio, duracion_minutos }) =>
  request("/servicios/mis-servicios/", {
    method: "POST",
    body: JSON.stringify({ servicio_id, precio, duracion_minutos }),
  });

//----- Mapa ----ç
export const getUbicacionesProfesionales = () =>
  request("/profesionales/ubicaciones/");

// ─── Búsqueda ────────────────────────────────────────────────────────────
export const buscarProfesionales = ({ q, servicio, categoria } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (servicio) params.set("servicio", servicio);
  if (categoria) params.set("categoria", categoria);

  const query = params.toString();
  return request(`/profesionales/buscar/${query ? `?${query}` : ""}`);
};

export const getServiciosDeProfesional = (profesionalId) =>
  request(`/profesionales/${profesionalId}/servicios/`);


// ─── Mis clientes ────────────────────────────────────────────────────────
export const getMisClientesUnicos = ({ estado, page, page_size } = {}) => {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  if (page) params.set("page", page);
  if (page_size) params.set("page_size", page_size);

  const query = params.toString();
  return request(`/profesionales/mis-clientes/unicos/${query ? `?${query}` : ""}`);
};
// ─── Historial de citas (todas, no agrupadas por cliente) ─────────────────
export const getMisClientes = ({ estado, page, page_size } = {}) => {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  if (page) params.set("page", page);
  if (page_size) params.set("page_size", page_size);

  const query = params.toString();
  return request(`/profesionales/mis-clientes/${query ? `?${query}` : ""}`);
};

// Trae TODAS las páginas — necesario para que la gráfica tenga el histórico completo
export const getTodasLasCitas = async ({ estado } = {}) => {
  let pagina = 1;
  let todas = [];
  let hayMas = true;

  while (hayMas) {
    const data = await getMisClientes({ estado, page: pagina, page_size: 50 });
    todas = todas.concat(data.results || []);
    hayMas = Boolean(data.next);
    pagina += 1;
  }

  return todas;
};

// ─── Calificaciones ─────────────────────────────────────────────────────
export const calificarCita = ({ cita_id, estrellas, comentario }) =>
  request("/profesionales/calificar/", {
    method: "POST",
    body: JSON.stringify({ cita_id, estrellas, comentario: comentario || "" }),
  });

// ─── Portafolio ─────────────────────────────────────────────────────────
export const subirImagenesPortafolio = (archivos, { citaId, descripcion } = {}) => {
  const formData = new FormData();
  archivos.forEach((archivo) => formData.append("imagenes", archivo));
  if (citaId) formData.append("cita_id", citaId);
  if (descripcion) formData.append("descripcion", descripcion);

  return requestFormData("/profesionales/portafolio/", formData, {
    method: "POST",
  });
};

// ─── Configuraciones (switches) ────────────────────────────────────────
export const getConfiguracionSwitches = () =>
  request("/configuraciones/switches/");

export const actualizarConfiguracionSwitches = (switches) =>
  request("/configuraciones/switches/", {
    method: "PATCH",
    body: JSON.stringify({ switches }),
  });

// ─── Websockets ──────────────────────────────────────────────────────────

export const getWsTicket = () =>
  request("/ws-ticket/");

export const cancelarCita = (citaId) =>
  request(`/citas/${citaId}/cancel/`, {
    method: "POST",
  });

// ─── Mensajería / Chat ────────────────────────────────────────────────────

export const getConversaciones = () =>
  request("/conversaciones/");

// Como profesional: pásale { cliente_id }. Como cliente: { profesional_id }.
export const obtenerOCrearConversacion = (payload) =>
  request("/conversaciones/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getMensajesConversacion = (conversacionId, { cursor, page_size } = {}) => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (page_size) params.set("page_size", page_size);
  const query = params.toString();
  return request(`/conversaciones/${conversacionId}/mensajes/${query ? `?${query}` : ""}`);
};

export const marcarConversacionLeida = (conversacionId) =>
  request(`/conversaciones/${conversacionId}/marcar_leido/`, {
    method: "POST",
  });

export const getCatalogoProfesional = (profesionalId) =>
  request(`/profesionales/${profesionalId}/catalogo/`);

export const getMiCatalogo = () =>
  request(`/profesionales/mi-catalogo/`);

export const eliminarImagenPortafolio = (imagenId) =>
  request(`/profesionales/portafolio/${imagenId}/`, {
    method: "DELETE",
  });

export const getMiCodigoQR = () =>
  request(`/profesionales/mi-qr/`);

export const iniciarCita = (citaId) =>
  request(`/citas/${citaId}/iniciar/`, { method: "POST" });

export const detenerCronometro = (citaId) =>
  request(`/citas/${citaId}/detener/`, { method: "POST" });