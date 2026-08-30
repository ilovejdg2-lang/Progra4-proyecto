import { textoIdioma } from "./idioma";

export const MAX_NOMBRE_USUARIO = 20;
export const MAX_PASSWORD = 64;
export const MIN_PASSWORD = 6;
export const MAX_PRODUCTO_NOMBRE = 200;
export const MAX_PRODUCTO_DESCRIPCION = 2000;

/** Límites de palabras para campos de texto libre (UI). */
export const MAX_PALABRAS_ETIQUETA = 8;
export const MAX_PALABRAS_TITULO = 15;
export const MAX_PALABRAS_BOTON = 6;
export const MAX_PALABRAS_TEXTO_BREVE = 40;
export const MAX_PALABRAS_TEXTO = 80;
export const MAX_PALABRAS_TEXTO_LARGO = 400;
export const MAX_PALABRAS_NOTAS = 50;
export const MAX_PALABRAS_PRODUCTO_NOMBRE = 12;
export const MAX_PALABRAS_PRODUCTO_DESCRIPCION = 80;
export const MAX_PALABRAS_MOTIVO = 40;

export function contactSupportMessage() {
  return textoIdioma(
    "Si el problema contin\u00faa, comun\u00edquese con el administrador del sitio.",
  );
}

const TECHNICAL_ERROR_PATTERN =
  /monster|runasp|supabase|bad gateway|err_network|axios|502|503|servidor de autenticaci\u00f3n|tiempo de espera agotado|error en la solicitud \(\d+\)|internal server error|exception|stack trace/i;

const MSG_ACCION_FALLIDA =
  "No se pudo completar la acci\u00f3n. Si el problema contin\u00faa, comun\u00edquese con el administrador del sitio.";
const MSG_ACCION_FALLIDA_AHORA =
  "No se pudo completar la acci\u00f3n en este momento. Si el problema contin\u00faa, comun\u00edquese con el administrador del sitio.";

/** Mensaje seguro para UI; en EN ya sale traducido (diccionario/caché). */
export function sanitizeUserFacingError(message) {
  if (!message || typeof message !== "string") {
    return textoIdioma(MSG_ACCION_FALLIDA);
  }

  if (TECHNICAL_ERROR_PATTERN.test(message)) {
    return textoIdioma(MSG_ACCION_FALLIDA_AHORA);
  }

  return textoIdioma(message);
}

export function contarPalabras(texto) {
  const value = String(texto ?? "").trim();
  if (!value) return 0;
  return value.split(/\s+/).filter(Boolean).length;
}

/** Recorta el texto para que no pase del máximo de palabras. */
export function limitarPalabras(texto, maxPalabras) {
  if (!maxPalabras || maxPalabras < 1) return String(texto ?? "");
  const raw = String(texto ?? "");
  if (!raw.trim()) return raw;

  const tokens = raw.match(/\S+|\s+/g) || [];
  let palabras = 0;
  let out = "";

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      if (out.length > 0) out += token;
      continue;
    }
    if (palabras >= maxPalabras) break;
    out += token;
    palabras += 1;
  }

  return out.replace(/\s+$/u, "");
}

export function etiquetaContadorPalabras(texto, maxPalabras) {
  const n = contarPalabras(texto);
  try {
    // Evitar dependencia circular: import dinámico no; usar localStorage + dict inline
    const idioma = String(localStorage.getItem("cafe-una-idioma") || "es").toLowerCase() === "en" ? "en" : "es";
    if (idioma === "en") return `${n}/${maxPalabras} words`;
  } catch {
    /* ignore */
  }
  return `${n}/${maxPalabras} palabras`;
}

/** Envuelve un onChange de input/textarea aplicando límite de palabras. */
export function conLimitePalabras(onChange, maxPalabras) {
  return (event) => {
    const name = event?.target?.name;
    const next = limitarPalabras(event?.target?.value, maxPalabras);
    if (typeof onChange !== "function") return;
    onChange({
      ...event,
      target: {
        ...event.target,
        name,
        value: next,
      },
    });
  };
}

export function validateNombreUsuario(nombre) {
  const value = (nombre ?? "").trim();
  if (!value) {
    return "Ingrese un nombre de usuario.";
  }
  if (value.length > MAX_NOMBRE_USUARIO) {
    return `El nombre no puede tener m\u00e1s de ${MAX_NOMBRE_USUARIO} caracteres.`;
  }
  return "";
}

export function validatePassword(password, { required = true } = {}) {
  const value = password ?? "";
  if (!value) {
    return required ? "Ingrese su contrase\u00f1a." : "";
  }
  if (value.length > MAX_PASSWORD) {
    return `La contrase\u00f1a no puede tener m\u00e1s de ${MAX_PASSWORD} caracteres.`;
  }
  if (value.length < MIN_PASSWORD) {
    return `La contrase\u00f1a debe tener al menos ${MIN_PASSWORD} caracteres.`;
  }
  return "";
}

export function validateProductoForm(form) {
  const errors = {};
  const nombre = (form.nombre ?? "").trim();
  const descripcion = (form.descripcion ?? "").trim();

  if (!nombre) {
    errors.nombre = "Ingrese el nombre del producto.";
  } else if (contarPalabras(nombre) > MAX_PALABRAS_PRODUCTO_NOMBRE) {
    errors.nombre = `El nombre no puede tener m\u00e1s de ${MAX_PALABRAS_PRODUCTO_NOMBRE} palabras.`;
  } else if (nombre.length > MAX_PRODUCTO_NOMBRE) {
    errors.nombre = `El nombre no puede tener m\u00e1s de ${MAX_PRODUCTO_NOMBRE} caracteres.`;
  }

  if (!descripcion) {
    errors.descripcion = "Ingrese la descripci\u00f3n del producto.";
  } else if (contarPalabras(descripcion) > MAX_PALABRAS_PRODUCTO_DESCRIPCION) {
    errors.descripcion = `La descripci\u00f3n no puede tener m\u00e1s de ${MAX_PALABRAS_PRODUCTO_DESCRIPCION} palabras.`;
  } else if (descripcion.length > MAX_PRODUCTO_DESCRIPCION) {
    errors.descripcion = `La descripci\u00f3n no puede tener m\u00e1s de ${MAX_PRODUCTO_DESCRIPCION} caracteres.`;
  }

  return errors;
}

export function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}
