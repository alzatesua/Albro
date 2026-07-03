import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  usuario: null,
  estaAutenticado: false,
  cargando: true,
  guardarSesion: () => {},
  limpiarSesion: () => {},
  usuarioActual: null,
  setUsuarioActual: () => {},
});

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al iniciar la app, recuperar sesión guardada
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        limpiarSesion();
      }
    }
    setCargando(false);
  }, []);

  const guardarSesion = (datos) => {
    localStorage.setItem("access_token", datos.access);
    localStorage.setItem("refresh_token", datos.refresh);
    localStorage.setItem("usuario", JSON.stringify(datos.usuario));
    localStorage.setItem("id_usuario", datos.usuario.id);
    setUsuario(datos.usuario);
    setUsuarioActual(datos.usuario);

    // Agregar un listener para cuando el token se vence
    const tokenExpiration = datos.access_expires;
    const currentTime = new Date().getTime() / 1000;
    if (tokenExpiration - currentTime < 60) {
      // Token se vence en menos de 1 minuto, refrescar token
      refreshAccessToken();
    }
  };

  const usuarioActual = () => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      return JSON.parse(usuarioGuardado);
    }
    return null;
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${BASE_URL}/usuarios/refresh-token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: localStorage.getItem('refresh_token') }),
      });

      const data = await response.json();
      if (response.ok) {
        guardarSesion(data);
      } else {
        // Token de refresh inválido, redirigir al login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error(error);
    }
  };

  const limpiarSesion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  const estaAutenticado = !!usuario;

  return (
    <AuthContext.Provider
      value={{ usuario, estaAutenticado, cargando, guardarSesion, limpiarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
