import { useSyncExternalStore } from "react";
import {
  guardarIdioma,
  IDIOMA_CHANGED_EVENT,
  obtenerIdioma,
} from "./idioma";
import { createWindowEventSubscribe } from "./windowEventStore";

const subscribe = createWindowEventSubscribe([IDIOMA_CHANGED_EVENT, "storage"]);

/** Idioma actual; se actualiza al instante al cambiar ES/EN. */
export function useIdioma() {
  const idioma = useSyncExternalStore(subscribe, obtenerIdioma, obtenerIdioma);

  return {
    idioma,
    setIdioma: (lang) => guardarIdioma(lang),
    esEn: idioma === "en",
  };
}
