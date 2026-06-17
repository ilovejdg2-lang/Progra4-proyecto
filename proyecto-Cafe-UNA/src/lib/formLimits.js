export const MAX_NOMBRE_USUARIO = 20;
export const MAX_PASSWORD = 15;
export const MIN_PASSWORD = 6;
export const MAX_PRODUCTO_NOMBRE = 200;
export const MAX_PRODUCTO_DESCRIPCION = 2000;

export const CAFE_CONTACT_EMAIL = "cafeunateaming@gmail.com";

export function contactSupportMessage() {
  return `Si el problema continúa, comuníquese con ${CAFE_CONTACT_EMAIL}.`;
}

const TECHNICAL_ERROR_PATTERN =
  /monster|runasp|supabase|bad gateway|err_network|axios|502|503|servidor de autenticación|tiempo de espera agotado|error en la solicitud \(\d+\)|internal server error|exception|stack trace/i;

export function sanitizeUserFacingError(message) {
  if (!message || typeof message !== "string") {
    return `No se pudo completar la acción. ${contactSupportMessage()}`;
  }

  if (TECHNICAL_ERROR_PATTERN.test(message)) {
    return `No se pudo completar la acción en este momento. ${contactSupportMessage()}`;
  }

  return message;
}

export function validateNombreUsuario(nombre) {
  const value = (nombre ?? "").trim();
  if (!value) {
    return "Ingrese un nombre de usuario.";
  }
  if (value.length > MAX_NOMBRE_USUARIO) {
    return `El nombre no puede tener más de ${MAX_NOMBRE_USUARIO} caracteres.`;
  }
  return "";
}

export function validatePassword(password, { required = true } = {}) {
  const value = password ?? "";
  if (!value) {
    return required ? "Ingrese su contraseña." : "";
  }
  if (value.length > MAX_PASSWORD) {
    return `La contraseña no puede tener más de ${MAX_PASSWORD} caracteres.`;
  }
  if (value.length < MIN_PASSWORD) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
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
    errors.nombre = `El nombre no puede tener más de ${MAX_PRODUCTO_NOMBRE} caracteres.`;
  }

  if (!descripcion) {
    errors.descripcion = "Ingrese la descripción del producto.";
  } else if (descripcion.length > MAX_PRODUCTO_DESCRIPCION) {
    errors.descripcion = `La descripción no puede tener más de ${MAX_PRODUCTO_DESCRIPCION} caracteres.`;
  }

  return errors;
}

export function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}
