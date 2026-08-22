export const MAX_NOMBRE_USUARIO = 20;
export const MAX_PASSWORD = 64;
export const MIN_PASSWORD = 6;
export const MAX_PRODUCTO_NOMBRE = 200;
export const MAX_PRODUCTO_DESCRIPCION = 2000;

export function contactSupportMessage() {
  return "Si el problema contin\u00faa, comun\u00edquese con el administrador del sitio.";
}

const TECHNICAL_ERROR_PATTERN =
  /monster|runasp|supabase|bad gateway|err_network|axios|502|503|servidor de autenticaci\u00f3n|tiempo de espera agotado|error en la solicitud \(\d+\)|internal server error|exception|stack trace/i;

export function sanitizeUserFacingError(message) {
  if (!message || typeof message !== "string") {
    return `No se pudo completar la acci\u00f3n. ${contactSupportMessage()}`;
  }

  if (TECHNICAL_ERROR_PATTERN.test(message)) {
    return `No se pudo completar la acci\u00f3n en este momento. ${contactSupportMessage()}`;
  }

  return message;
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
  } else if (nombre.length > MAX_PRODUCTO_NOMBRE) {
    errors.nombre = `El nombre no puede tener m\u00e1s de ${MAX_PRODUCTO_NOMBRE} caracteres.`;
  }

  if (!descripcion) {
    errors.descripcion = "Ingrese la descripci\u00f3n del producto.";
  } else if (descripcion.length > MAX_PRODUCTO_DESCRIPCION) {
    errors.descripcion = `La descripci\u00f3n no puede tener m\u00e1s de ${MAX_PRODUCTO_DESCRIPCION} caracteres.`;
  }

  return errors;
}

export function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}
