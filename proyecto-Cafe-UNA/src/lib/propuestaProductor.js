import {
  cantonesDeProvincia,
  distritosDeCanton,
  PROVINCIAS_CR,
} from "./costaRicaDivisiones";
import {
  estaEnCostaRica,
  esUrlMapasOWaze,
  MENSAJE_SOLO_COSTA_RICA,
} from "./ubicacionMaps";

export const DESCRIPCION_MAX = 2000;
export const NOMBRE_MAX = 100;
export const DIRECCION_MAX = 500;
export const URL_MAX = 500;
export const MOTIVO_MIN = 10;
export const MOTIVO_MAX = 1000;
export const SUGERENCIAS_MAX = 1000;
export const NOTA_INTERNA_MAX = 2000;
export const COMENTARIO_MAX = 1000;
export const ESTADOS_PROPUESTA = ["Pendiente", "En revisión", "Aprobada", "Rechazada"];
export const esPropuestaAbierta = (estado) => estado === "Pendiente" || estado === "En revisión";
export const IMAGEN_MAX_BYTES = 5 * 1024 * 1024;
export const TERMINOS_VERSION = "propuesta-productor-v1";
export const TERMINOS_TEXTO =
  "Autorizo la publicación de la información de mi emprendimiento en el sitio web de Café UNA si mi propuesta es aprobada. Entiendo que cualquier cambio posterior deberá solicitarse por correo al administrador";
export const AYUDA_DESCRIPCION =
  "Cuéntanos qué ofrecen, su historia, sus valores y qué distingue a su emprendimiento";

const HOSTS_FACEBOOK = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "fb.com",
  "www.fb.com",
  "m.fb.com",
  "fb.me",
  "www.fb.me",
]);
const HOSTS_INSTAGRAM = new Set(["instagram.com", "www.instagram.com"]);

function urlSegura(valor) {
  let url;
  try {
    url = new URL(String(valor || "").trim());
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return url;
}

export function validarEnlaceUbicacion(valor) {
  const raw = String(valor || "").trim();
  if (!raw) return "El enlace de ubicación es obligatorio.";
  if (raw.length > URL_MAX) {
    return `El enlace de ubicación admite como máximo ${URL_MAX} caracteres.`;
  }
  const url = urlSegura(raw);
  if (!url) {
    return "Ese texto no es un enlace válido. Copiá la URL completa desde Google Maps o Waze.";
  }
  if (url.protocol !== "https:") return "El enlace debe empezar con https://";
  if (!esUrlMapasOWaze(url)) {
    return "Ese enlace no es de Google Maps ni de Waze. Abrí el lugar, tocá Compartir y pegá ese enlace aquí.";
  }
  return "";
}

export function validarCoordenadasUbicacion(latitud, longitud) {
  const lat = Number(latitud);
  const lng = Number(longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "Confirmá el punto en el mapa de Costa Rica antes de enviar. Si el enlace no marca el lugar exacto, tocá el mapa.";
  }
  if (!estaEnCostaRica(lat, lng)) {
    return MENSAJE_SOLO_COSTA_RICA;
  }
  return "";
}

function validarRed(valor, etiqueta, hosts) {
  const raw = String(valor || "").trim();
  if (!raw) return "";
  if (raw.length > URL_MAX) return `${etiqueta} admite como máximo ${URL_MAX} caracteres.`;
  const url = urlSegura(raw);
  if (!url || url.protocol !== "https:") return `${etiqueta} debe ser un enlace HTTPS válido.`;
  if (!hosts.has(url.hostname.toLowerCase())) return `${etiqueta} no corresponde a un enlace válido.`;
  return "";
}

export function validarSitioWeb(valor) {
  const raw = String(valor || "").trim();
  if (!raw) return "";
  const url = urlSegura(raw);
  if (!url) return "El sitio web no es un enlace válido.";
  if (!url.hostname.includes(".")) return "El sitio web no es un enlace válido.";
  return "";
}

export function validarWhatsapp(valor) {
  const raw = String(valor || "").trim();
  if (!raw) return "";
  let digitos = raw.replace(/\D/g, "");
  if (digitos.startsWith("00")) digitos = digitos.slice(2);
  const tieneCodigo = raw.startsWith("+") || raw.startsWith("00") || digitos.length >= 10;
  if (!tieneCodigo || digitos.length < 10 || digitos.length > 15) {
    return "El WhatsApp debe incluir el código de país, por ejemplo +506 8888 8888.";
  }
  return "";
}

export function validarTelefonoContacto(valor) {
  const raw = String(valor || "").trim();
  if (!raw) return "El teléfono de contacto es obligatorio.";
  const digitos = raw.replace(/\D/g, "");
  if (digitos.length < 8 || digitos.length > 15) return "El teléfono no tiene un formato válido.";
  return "";
}

export function validarCorreoContacto(valor) {
  const raw = String(valor || "").trim();
  if (!raw) return "El correo de contacto es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return "El correo no tiene un formato válido.";
  return "";
}

export function validarImagenArchivo(archivo) {
  if (!archivo) return "La imagen representativa es obligatoria.";
  const nombre = String(archivo.name || "").toLowerCase();
  const tipo = String(archivo.type || "").toLowerCase();
  const extensionOk = /\.(jpe?g|png|webp)$/.test(nombre);
  const tipoOk = ["image/jpeg", "image/png", "image/webp"].includes(tipo);
  if (!extensionOk && !tipoOk) return "La imagen debe ser JPG, JPEG, PNG o WebP.";
  if (archivo.size > IMAGEN_MAX_BYTES) return "La imagen no puede superar 5 MB.";
  return "";
}

export function validarFormularioPropuesta(form, archivo) {
  const errores = {};
  const nombre = String(form.nombre || "").trim();
  if (!nombre) errores.nombre = "El nombre del emprendimiento es obligatorio.";
  else if (nombre.length > NOMBRE_MAX) errores.nombre = `El nombre admite como máximo ${NOMBRE_MAX} caracteres.`;

  const descripcion = String(form.descripcion || "").trim();
  if (!descripcion) errores.descripcion = "La descripción es obligatoria.";
  else if (descripcion.length > DESCRIPCION_MAX) {
    errores.descripcion = `La descripción admite como máximo ${DESCRIPCION_MAX} caracteres.`;
  }

  if (!form.provincia || !PROVINCIAS_CR.includes(form.provincia)) {
    errores.provincia = "Seleccione la provincia";
  } else if (!form.canton || !cantonesDeProvincia(form.provincia).includes(form.canton)) {
    errores.canton = "Seleccione el cantón";
  } else if (!form.distrito || !distritosDeCanton(form.provincia, form.canton).includes(form.distrito)) {
    errores.distrito = "Seleccione el distrito";
  }

  const direccion = String(form.direccion || "").trim();
  if (!direccion) errores.direccion = "Indique la dirección o señas";
  else if (direccion.length > DIRECCION_MAX) {
    errores.direccion = `La dirección admite como máximo ${DIRECCION_MAX} caracteres.`;
  }

  const enlace = validarEnlaceUbicacion(form.enlaceUbicacion);
  if (enlace) errores.enlaceUbicacion = enlace;
  else {
    const coords = validarCoordenadasUbicacion(form.latitud, form.longitud);
    if (coords) errores.enlaceUbicacion = coords;
  }
  const facebook = validarRed(form.facebook, "Facebook", HOSTS_FACEBOOK);
  if (facebook) errores.facebook = facebook;
  const instagram = validarRed(form.instagram, "Instagram", HOSTS_INSTAGRAM);
  if (instagram) errores.instagram = instagram;
  const whatsapp = validarWhatsapp(form.whatsapp);
  if (whatsapp) errores.whatsapp = whatsapp;
  const sitio = validarSitioWeb(form.sitioWeb);
  if (sitio) errores.sitioWeb = sitio;
  const correo = validarCorreoContacto(form.correo);
  if (correo) errores.correo = correo;
  const telefono = validarTelefonoContacto(form.telefono);
  if (telefono) errores.telefono = telefono;
  const imagen = validarImagenArchivo(archivo);
  if (imagen) errores.imagen = imagen;
  if (!form.aceptaTerminos) {
    errores.aceptaTerminos = "Debés aceptar la autorización de publicación para enviar la propuesta.";
  }
  return errores;
}

/** Mismas reglas del formulario público, sin imagen ni términos (edición del administrador). */
export function validarEdicionPropuesta(form) {
  const errores = validarFormularioPropuesta(
    { ...form, aceptaTerminos: true },
    { name: "actual.jpg", type: "image/jpeg", size: 1 },
  );
  delete errores.imagen;
  delete errores.aceptaTerminos;
  return errores;
}

export function formatearFechaPropuesta(fecha) {
  if (!fecha) return "";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "";
  return valor.toLocaleString("es-CR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  });
}

export function urlImagenPublica(ruta) {
  if (!ruta) return "";
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = String(import.meta.env.BACKEND_URL || "").replace(/\/api\/?$/, "");
  return `${base}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}
