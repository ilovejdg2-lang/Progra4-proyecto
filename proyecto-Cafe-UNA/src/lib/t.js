import { textoIdioma } from "./idioma";

/** Atajo síncrono ES→EN según idioma actual (diccionario + caché). */
export function t(es) {
  return textoIdioma(String(es ?? ""));
}
