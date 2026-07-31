import { Navigate } from "react-router";
import { useAuthAdmin } from "@/context/AuthContextAdmin";

const RutaProtegidaAdmin = ({ children }) => {
  const { estaAutenticado, cargando } = useAuthAdmin();

  if (cargando) return null;

  return estaAutenticado ? children : <Navigate to="/gestion-x9k2/login" replace />;
};

export default RutaProtegidaAdmin;