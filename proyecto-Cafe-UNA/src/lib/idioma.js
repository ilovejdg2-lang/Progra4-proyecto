import { invalidateAllPageCaches } from "./pageDataCache";
import { traducirSync } from "./traducir";

const STORAGE_KEY = "cafe-una-idioma";
export const IDIOMA_CHANGED_EVENT = "cafe-una-idioma-changed";

export function normalizarIdioma(valor) {
  return String(valor ?? "es").trim().toLowerCase() === "en" ? "en" : "es";
}

export function obtenerIdioma() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) return normalizarIdioma(guardado);
  } catch {
    /* ignore */
  }
  return "es";
}

export function guardarIdioma(idioma) {
  const lang = normalizarIdioma(idioma);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "en" ? "en" : "es";
  }
  try {
    invalidateAllPageCaches();
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(IDIOMA_CHANGED_EVENT, { detail: { idioma: lang } }));
  return lang;
}

/**
 * Texto según idioma. Ya no usa columnas *En de Supabase:
 * en inglés traduce el español automáticamente (diccionario + caché).
 * El 2.º argumento se ignora (compatibilidad).
 */
export function textoIdioma(es, _enIgnorado, idioma = obtenerIdioma()) {
  const base = String(es ?? "");
  if (normalizarIdioma(idioma) !== "en") return base;
  return traducirSync(base);
}

/**
 * Sustituye campos por su traducción EN automática (sin *En en BD).
 */
export function localizarObjeto(obj, campos, idioma = obtenerIdioma()) {
  if (!obj || typeof obj !== "object") return obj;
  if (normalizarIdioma(idioma) !== "en") return { ...obj };
  const out = { ...obj };
  for (const campo of campos) {
    const val = out[campo];
    if (typeof val === "string" && val.trim()) {
      out[campo] = traducirSync(val);
    }
  }
  return out;
}
