/** Límites para validar pines (territorio continental + un poco de margen). */
export const CR_LAT_MIN = 7.9;
export const CR_LAT_MAX = 11.35;
export const CR_LNG_MIN = -86.1;
export const CR_LNG_MAX = -82.55;
export const CR_CENTER = [9.94, -84.08];
export const CR_BOUNDS = [
  [CR_LAT_MIN, CR_LNG_MIN],
  [CR_LAT_MAX, CR_LNG_MAX],
];
/** Zoom inicial del mapa público (evita que pantallas anchas muestren Panamá). */
export const CR_VIEW_ZOOM = 8;
/** Tope de pan: casi el país; sin abrir tanto el Caribe/Panamá. */
export const CR_MAX_BOUNDS = [
  [8.0, -86.05],
  [11.25, -82.55],
];

export function esParCoordenadas(lat, lng) {
  const latitud = Number(lat);
  const longitud = Number(lng);
  return (
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    latitud >= -90 &&
    latitud <= 90 &&
    longitud >= -180 &&
    longitud <= 180
  );
}

export function estaEnCostaRica(lat, lng) {
  const latitud = Number(lat);
  const longitud = Number(lng);
  return (
    esParCoordenadas(latitud, longitud) &&
    latitud >= CR_LAT_MIN &&
    latitud <= CR_LAT_MAX &&
    longitud >= CR_LNG_MIN &&
    longitud <= CR_LNG_MAX
  );
}

export const MENSAJE_SOLO_COSTA_RICA =
  "La ubicación tiene que estar en Costa Rica. El mapa público solo cubre el país; pegá un enlace del lugar en CR o marcá el punto en el mapa.";

export function coordenadasDeProductor(item) {
  if (!item) return null;
  const latitud = Number(item.latitud ?? item.Latitud);
  const longitud = Number(item.longitud ?? item.Longitud);
  if (!esParCoordenadas(latitud, longitud)) return null;
  return { latitud, longitud };
}

/** Hosts de Maps/Waze (también para seguir coords en la URL). */
export function hostMapasPermitido(hostname) {
  const host = String(hostname || "").toLowerCase();
  return (
    host === "maps.google.com" ||
    host === "www.maps.google.com" ||
    host === "maps.google.co.cr" ||
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "www.goo.gl" ||
    host === "google.com" ||
    host === "www.google.com" ||
    host === "google.co.cr" ||
    host === "www.google.co.cr" ||
    host === "waze.com" ||
    host === "www.waze.com" ||
    host === "ul.waze.com"
  );
}

/** Dominios / rutas de Google Maps y Waze que aceptamos al pegar el enlace. */
export function esUrlMapasOWaze(url) {
  if (!url || url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  const path = url.pathname || "/";
  if (
    host === "maps.google.com" ||
    host === "www.maps.google.com" ||
    host === "maps.google.co.cr" ||
    host === "maps.app.goo.gl"
  ) {
    return true;
  }
  if (
    (host === "goo.gl" || host === "www.goo.gl") &&
    (path === "/maps" || path.startsWith("/maps/"))
  ) {
    return true;
  }
  if (
    (host === "google.com" ||
      host === "www.google.com" ||
      host === "google.co.cr" ||
      host === "www.google.co.cr") &&
    (path === "/maps" || path.startsWith("/maps/"))
  ) {
    return true;
  }
  if (host === "waze.com" || host === "www.waze.com" || host === "ul.waze.com") {
    return true;
  }
  return false;
}

/** Extrae pin confiable del enlace; no usa solo el centro de cámara @lat,lng. */
export function extraerCoordenadasDeEnlace(enlace) {
  const raw = String(enlace || "").trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!hostMapasPermitido(url.hostname)) return null;
  let texto = `${url.pathname}${url.search}${url.hash}`;
  try {
    texto = decodeURIComponent(texto);
  } catch {
    /* enlace ya plano */
  }
  const lugar = texto.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i);
  if (lugar) {
    const latitud = Number(lugar[1]);
    const longitud = Number(lugar[2]);
    if (esParCoordenadas(latitud, longitud)) return { latitud, longitud };
  }
  // Destino de /maps/dir/... : !2m2!1dLNG!2dLAT
  const destino = texto.match(/!2m2!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/i);
  if (destino) {
    const longitud = Number(destino[1]);
    const latitud = Number(destino[2]);
    if (esParCoordenadas(latitud, longitud)) return { latitud, longitud };
  }
  for (const clave of ["ll", "sll"]) {
    const valor = url.searchParams.get(clave);
    if (!valor) continue;
    const partes = valor.split(",");
    if (partes.length >= 2) {
      const latitud = Number(partes[0]);
      const longitud = Number(partes[1]);
      if (esParCoordenadas(latitud, longitud)) return { latitud, longitud };
    }
  }
  const q = url.searchParams.get("q") || url.searchParams.get("query") || "";
  const qMatch = q.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (qMatch) {
    const latitud = Number(qMatch[1]);
    const longitud = Number(qMatch[2]);
    if (esParCoordenadas(latitud, longitud)) return { latitud, longitud };
  }
  const pathSearch = url.pathname.match(
    /\/maps\/(?:search|place)\/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i,
  );
  if (pathSearch) {
    const latitud = Number(pathSearch[1]);
    const longitud = Number(pathSearch[2]);
    if (esParCoordenadas(latitud, longitud)) return { latitud, longitud };
  }
  return null;
}

export function resumenUbicacion(item) {
  const zona = String(item?.distrito || item?.canton || "").trim();
  const provincia = String(item?.provincia || "").trim();
  if (zona && provincia && zona.toLowerCase() !== provincia.toLowerCase()) {
    return `${zona}, ${provincia}`;
  }
  return zona || provincia || String(item?.direccion || item?.senas || "").trim();
}
