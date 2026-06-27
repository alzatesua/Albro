import { useState, useEffect } from "react";
import { getPerfilProfesional } from "@/services/api";

/**
 * Retorna si un profesional necesita completar su perfil.
 *
 * - `necesitaPerfil === null`  → todavía verificando (muestra nada / skeleton)
 * - `necesitaPerfil === true`  → mostrar el modal bloqueante
 * - `necesitaPerfil === false` → perfil ya existe, dejar pasar
 */
export function usePerfilProfesional(rol) {
  const [necesitaPerfil, setNecesitaPerfil] = useState(null);

  useEffect(() => {
    // Solo aplica para profesionales
    if (rol !== "profesional") {
      setNecesitaPerfil(false);
      return;
    }

    getPerfilProfesional()
      .then(() => setNecesitaPerfil(false))   // 200 → perfil existe
      .catch((err) => {
        // 404 con el detalle específico → necesita completar perfil
        if (err.status === 404 || err.message?.includes("no tiene perfil")) {
          setNecesitaPerfil(true);
        } else {
          // Otro error de red: no bloqueamos al usuario
          console.error("Error verificando perfil profesional:", err);
          setNecesitaPerfil(false);
        }
      });
  }, [rol]);

  const marcarCompleto = () => setNecesitaPerfil(false);

  return { necesitaPerfil, marcarCompleto };
}