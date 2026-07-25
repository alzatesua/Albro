import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

export const AGENDAR_PENDIENTE_KEY = "profesional_agendar_pendiente";

const AgendarProfesionalPage = () => {
  const { profesionalId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => {
    if (profesionalId) {
      localStorage.setItem(AGENDAR_PENDIENTE_KEY, profesionalId);
    }

    if (usuario) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [usuario, profesionalId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Redirigiendo...</p>
    </div>
  );
};

export default AgendarProfesionalPage;