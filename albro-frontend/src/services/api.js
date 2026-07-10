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
      // Token inválido, redirigir al login
      window.location.href = '/login';
    } else {
      const mensaje =
        data?.detail ||
        data?.detalle ||   // Django a veces responde con "detalle" en español
        data?.message ||
        Object.entries(data)
          .map(([campo, errs]) => {
            const texto = Array.isArray(errs) ? errs.join(", ") : errs;
            return campo === "non_field_errors" ? texto : `${campo}: ${texto}`;
          })
          .join(" · ");

      const err = new Error(mensaje);
      err.status = res.status; // necesario para detectar 404 en usePerfilProfesional
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


//----- Mapa ----ç
export const getUbicacionesProfesionales = () =>
  request("/profesionales/ubicaciones/");

// ─── Websockets ──────────────────────────────────────────────────────────

export const getWsTicket = () =>
  request("/ws-ticket/");

export const cancelarCita = (citaId) =>
  request(`/citas/${citaId}/cancel/`, {
    method: "POST",
  });