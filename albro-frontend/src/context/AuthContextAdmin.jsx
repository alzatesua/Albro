import { createContext, useContext, useState, useEffect } from "react";

const AuthContextAdmin = createContext({
  estaAutenticado: false,
  cargando: true,
  guardarSesionAdmin: () => {},
  limpiarSesionAdmin: () => {},
});

export const AuthProviderAdmin = ({ children }) => {
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al iniciar la app, recuperar sesión guardada
  useEffect(() => {
    const tokenGuardado = localStorage.getItem("panel_access_token");
    if (tokenGuardado) {
      setToken(tokenGuardado);
    }
    setCargando(false);
  }, []);

  const guardarSesionAdmin = (datos) => {
    localStorage.setItem("panel_access_token", datos.access);
    setToken(datos.access);
  };

  const limpiarSesionAdmin = () => {
    localStorage.removeItem("panel_access_token");
    setToken(null);
  };

  const estaAutenticado = !!token;

  return (
    <AuthContextAdmin.Provider
      value={{ estaAutenticado, cargando, guardarSesionAdmin, limpiarSesionAdmin }}
    >
      {children}
    </AuthContextAdmin.Provider>
  );
};

export const useAuthAdmin = () => {
  const ctx = useContext(AuthContextAdmin);
  if (!ctx) throw new Error("useAuthAdmin debe usarse dentro de <AuthProviderAdmin>");
  return ctx;
};