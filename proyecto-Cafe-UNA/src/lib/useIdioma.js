import { useEffect, useState } from "react";
import {
  guardarIdioma,
  IDIOMA_CHANGED_EVENT,
  normalizarIdioma,
  obtenerIdioma,
} from "./idioma";

/** Idioma actual; se actualiza al instante al cambiar ES/EN. */
export function useIdioma() {
  const [idioma, setIdioma] = useState(() => obtenerIdioma());

  useEffect(() => {
    const sync = (event) => {
      const next = event?.detail?.idioma ?? obtenerIdioma();
      setIdioma(normalizarIdioma(next));
    };
    window.addEventListener(IDIOMA_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(IDIOMA_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    idioma,
    setIdioma: (lang) => setIdioma(guardarIdioma(lang)),
    esEn: idioma === "en",
  };
}
