const MAX_DIRECCION = 300;
const MAX_URL = 500;
const PREFIJOS_IMAGEN = [
  "/api/inventario/ubicaciones/imagenes/",
  "/api/productos/imagenes/",
  "/api/informacion/imagenes/",
];

export function esUrlGoogleMaps(value) {
  const texto = String(value || "").trim();
  if (!texto) return false;
  let url;
  try {
    url = new URL(texto);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;

  const host = url.hostname.replace(/\.$/, "").toLowerCase();
  const path = url.pathname.toLowerCase();
  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl" && (path === "/maps" || path.startsWith("/maps/"))) return true;
  if (/^maps\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)) return true;
  if (
    /^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host) &&
    (path === "/maps" || path.startsWith("/maps/"))
  ) {
    return true;
  }
  return false;
}

export function mensajeDireccionPunto(value) {
  const texto = String(value || "").trim();
  if (!texto) return null;
  if (texto.length > MAX_DIRECCION) {
    return "La dirección debe tener como máximo 300 caracteres.";
  }
  return null;
}

export function mensajeImagenPunto(value) {
  const texto = String(value || "").trim();
  if (!texto) return null;
  if (texto.length > MAX_URL) return "La URL de la imagen es demasiado larga.";
  const propia = PREFIJOS_IMAGEN.find((prefijo) => texto.startsWith(prefijo));
  if (propia) {
    const nombre = texto.slice(propia.length);
    if (!nombre || nombre.includes("/") || !/^[A-Za-z0-9._-]+$/.test(nombre)) {
      return "La imagen del punto de venta no es válida.";
    }
    return null;
  }
  try {
    const url = new URL(texto);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "La imagen debe ser una URL http o https.";
    }
  } catch {
    return "La imagen del punto de venta no es válida.";
  }
  return null;
}

export function mensajeTelefonoPunto(value) {
  const texto = String(value || "").trim();
  if (!texto) return null;
  const digitos = texto.replace(/\D/g, "");
  if (texto.length > 40 || !/^[0-9+\s().-]+$/.test(texto) || digitos.length < 6) {
    return "El teléfono debe tener entre 6 y 40 caracteres válidos.";
  }
  return null;
}

export function mensajeHorarioPunto(value) {
  const texto = String(value || "").trim();
  if (!texto) return null;
  if (texto.length > 300) return "El horario debe tener como máximo 300 caracteres.";
  return null;
}

export function mensajeMapsPunto(value) {
  const texto = String(value || "").trim();
  if (!texto) return null;
  if (texto.length > MAX_URL) return "La URL de Google Maps es demasiado larga.";
  if (!esUrlGoogleMaps(texto)) return "El enlace debe ser una URL válida de Google Maps.";
  return null;
}
