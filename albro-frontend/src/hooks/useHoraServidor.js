import { useState, useEffect, useCallback, useRef } from "react";

// Guarda la diferencia (en ms) entre la hora del servidor y la del navegador.
// hora_real_actual = new Date(Date.now() + offset)
let offsetGlobal = 0;
let sincronizado = false;

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8006/api";

export const sincronizarHoraServidor = async () => {
  try {
    const antes = Date.now();
    const res = await fetch(`${BASE_URL}/citas/`, { method: "HEAD" });
    const despues = Date.now();

    const fechaHeader = res.headers.get("Date");
    if (!fechaHeader) return;

    const horaServidor = new Date(fechaHeader).getTime();
    // Compensamos la latencia de ida y vuelta a la mitad
    const latencia = (despues - antes) / 2;
    const horaLocalEstimadaAlMomento = antes + latencia;

    offsetGlobal = horaServidor + latencia - horaLocalEstimadaAlMomento;
    sincronizado = true;
  } catch {
    // Si falla, seguimos usando la hora local tal cual (offset = 0)
  }
};

export const ahoraServidor = () => new Date(Date.now() + offsetGlobal);

export const useHoraServidor = (intervaloMs = 1000) => {
  const [ahora, setAhora] = useState(() => ahoraServidor());
  const listo = useRef(sincronizado);

  useEffect(() => {
    if (!sincronizado) {
      sincronizarHoraServidor().then(() => {
        listo.current = true;
        setAhora(ahoraServidor());
      });
    }

    const interval = setInterval(() => setAhora(ahoraServidor()), intervaloMs);
    return () => clearInterval(interval);
  }, [intervaloMs]);

  return ahora;
};