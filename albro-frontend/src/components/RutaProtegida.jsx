import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const RutaProtegida = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) return null; // o un spinner

  return estaAutenticado ? children : <Navigate to="/login" replace />;
};

export default RutaProtegida;