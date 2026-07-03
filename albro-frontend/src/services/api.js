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
          .map(([campo, errs]) => `${campo}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
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


export const getGeocodingApiKey = () =>
  import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY || "";


// ─── Servicios ────────────────────────────────────────────────────────────────

export const getCategorias = () =>
  request("/servicios/categorias/");

export const getServiciosPorCategoria = (categoriaId) =>
  request(`/servicios/servicios/?categoria=${categoriaId}`);

// ─── Profesionales ────────────────────────────────────────────────────────────────
export const getProfesionalesPorServicio = (servicioId) =>
  request(`/servicios/profesionales/?servicio=${servicioId}`);


// ─── Agendas ────────────────────────────────────────────────────────────────
export const getAgendaProfesional = (profesionalId, servicioId, fecha) =>
  request(`/profesionales/${profesionalId}/agenda/?servicio=${servicioId}&fecha=${fecha}`);
