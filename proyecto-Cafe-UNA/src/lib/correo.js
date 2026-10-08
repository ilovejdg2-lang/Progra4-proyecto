export const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MENSAJE_CORREO_INVALIDO = "Ingresá un correo válido (ejemplo: nombre@correo.com).";

/** Valida formato nombre@dominio.ext (ignora espacios al inicio y final). */
export function esCorreoValido(valor) {
  return CORREO_REGEX.test(String(valor ?? "").trim());
}

/** Quita todos los espacios en blanco (para usar en onChange). */
export function limpiarCorreo(valor) {
  return String(valor ?? "").replace(/\s/g, "");
}
