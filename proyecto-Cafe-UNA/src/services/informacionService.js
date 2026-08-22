import { invalidateAllPageCaches } from "../lib/pageDataCache";
import { createDomainRequest, createKeyedCache } from "./serviceHelpers";

const BASE_URL = `${import.meta.env.BACKEND_URL}/informacion`;
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = createKeyedCache(CACHE_TTL_MS);

function clearInfoCache() {
  cache.clear();
  invalidateAllPageCaches();
}

const request = createDomainRequest(
  "Error en informaci\u00f3n",
  "Tiempo de espera agotado al consultar informaci\u00f3n.",
);

async function domainRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isPublicRead = method === "GET";
  return request(url, {
    ...options,
    skipAuth: isPublicRead ? true : options.skipAuth,
  });
}

export async function obtenerInformacion() {
  return cache.get("all", () => domainRequest(BASE_URL));
}

export async function obtenerSeccion(seccion) {
  return cache.get(`section:${seccion}`, () =>
    domainRequest(`${BASE_URL}/${encodeURIComponent(seccion)}`),
  );
}

export async function actualizarInformacion(nuevaInformacion) {
  const result = await domainRequest(BASE_URL, {
    method: "PUT",
    data: nuevaInformacion,
  });
  clearInfoCache();
  return result;
}

export async function actualizarSeccion(seccion, cambios) {
  const result = await domainRequest(`${BASE_URL}/${encodeURIComponent(seccion)}`, {
    method: "PATCH",
    data: cambios,
  });
  clearInfoCache();
  return result;
}

export async function agregarGaleriaItem(item) {
  const result = await domainRequest(`${BASE_URL}/galeria`, {
    method: "POST",
    data: item,
  });
  clearInfoCache();
  return result;
}

export async function actualizarGaleriaItem(id, cambios) {
  const result = await domainRequest(`${BASE_URL}/galeria/${id}`, {
    method: "PUT",
    data: cambios,
  });
  clearInfoCache();
  return result;
}

export async function eliminarGaleriaItem(id) {
  await domainRequest(`${BASE_URL}/galeria/${id}`, {
    method: "DELETE",
  });
  clearInfoCache();
  return true;
}

export async function obtenerHero() {
  return cache.get("hero", () => domainRequest(`${BASE_URL}/hero`));
}

export async function obtenerNavbar() {
  return cache.get("navbar", () => domainRequest(`${BASE_URL}/navbar`));
}

export async function actualizarNavbar(cambios) {
  const result = await domainRequest(`${BASE_URL}/navbar`, {
    method: "PATCH",
    data: cambios,
  });
  clearInfoCache();
  return result;
}

export async function obtenerFooter() {
  return cache.get("footer", () => domainRequest(`${BASE_URL}/footer`));
}

export async function actualizarFooter(cambios) {
  const result = await domainRequest(`${BASE_URL}/footer`, {
    method: "PATCH",
    data: cambios,
  });
  clearInfoCache();
  return result;
}

export async function obtenerEnlaces(seccion) {
  const key = `enlaces:${seccion || "all"}`;
  const query = seccion ? `?seccion=${encodeURIComponent(seccion)}` : "";
  return cache.get(key, () =>
    domainRequest(`${BASE_URL}/enlaces${query}`).then((data) => (Array.isArray(data) ? data : [])),
  );
}

export async function crearEnlace(item) {
  const result = await domainRequest(`${BASE_URL}/enlaces`, {
    method: "POST",
    data: item,
  });
  clearInfoCache();
  return result;
}

export async function actualizarEnlace(id, cambios) {
  const result = await domainRequest(`${BASE_URL}/enlaces/${id}`, {
    method: "PUT",
    data: cambios,
  });
  clearInfoCache();
  return result;
}

export async function eliminarEnlace(id) {
  await domainRequest(`${BASE_URL}/enlaces/${id}`, {
    method: "DELETE",
  });
  clearInfoCache();
  return true;
}

export async function obtenerTarjetasInicio() {
  return cache.get("tarjetas-inicio", () =>
    domainRequest(`${BASE_URL}/tarjetas-inicio`).then((data) => (Array.isArray(data) ? data : [])),
  );
}

export async function actualizarTarjetasInicio(tarjetas) {
  const result = await domainRequest(`${BASE_URL}/tarjetas-inicio`, {
    method: "PATCH",
    data: { tarjetas },
  });
  clearInfoCache();
  return Array.isArray(result) ? result : [];
}

export async function obtenerInformacionSobreNosotros() {
  return cache.get("sobre-nosotros", async () => {
    const bulk = await domainRequest(BASE_URL);

    return {
      historia: bulk?.historia ?? {},
      mission: bulk?.mission ?? {},
      vision: bulk?.vision ?? {},
      gallery: Array.isArray(bulk?.gallery) ? bulk.gallery : [],
    };
  });
}