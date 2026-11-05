import { useSyncExternalStore } from "react";
import {
  guardarIdioma,
  IDIOMA_CHANGED_EVENT,
  obtenerIdioma,
} from "./idioma";

function subscribe(onChange) {
  window.addEventListener(IDIOMA_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(IDIOMA_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Idioma actual; se actualiza al instante al cambiar ES/EN. */
export function useIdioma() {
  const idioma = useSyncExternalStore(subscribe, obtenerIdioma, obtenerIdioma);

  return {
    idioma,
    setIdioma: (lang) => guardarIdioma(lang),
    esEn: idioma === "en",
  };
}
