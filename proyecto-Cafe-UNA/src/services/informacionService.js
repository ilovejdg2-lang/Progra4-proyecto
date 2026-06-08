import { getActiveSessionUser } from "./sessionService";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/informacion`;
const CACHE_TTL_MS = 15000;
const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.promise;
}

function setCache(key, promise) {
  cache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    promise,
  });
  promise.catch(() => cache.delete(key));
  return promise;
}

function clearInfoCache() {
  cache.clear();
}

function obtenerActorRoles() {
  try {
    const user = getActiveSessionUser();
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    if (String(user?.role || "").toLowerCase() === "admin" && !roles.some((rol) => String(rol).toLowerCase() === "admin")) {
      return [...roles, "Admin"];
    }
    return roles;
  } catch {
    return [];
  }
}

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    errorPrefix: "Error en informacion",
    timeoutMessage: "Tiempo de espera agotado al consultar informacion.",
  });
}

export async function obtenerInformacion() {
  return getCache("all") ?? setCache("all", request(BASE_URL));
}

export async function obtenerSeccion(seccion) {
  const key = `section:${seccion}`;
  return getCache(key) ?? setCache(key, request(`${BASE_URL}/${encodeURIComponent(seccion)}`));
}

export async function actualizarInformacion(nuevaInformacion) {
  const result = await request(BASE_URL, {
    method: "PUT",
    body: JSON.stringify(nuevaInformacion),
  });
  clearInfoCache();
  return result;
}

export async function actualizarSeccion(seccion, cambios) {
  const result = await request(`${BASE_URL}/${encodeURIComponent(seccion)}`, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });
  clearInfoCache();
  return result;
}

export async function agregarGaleriaItem(item) {
  const result = await request(`${BASE_URL}/galeria`, {
    method: "POST",
    body: JSON.stringify(item),
  });
  clearInfoCache();
  return result;
}

export async function actualizarGaleriaItem(id, cambios) {
  const result = await request(`${BASE_URL}/galeria/${id}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
  clearInfoCache();
  return result;
}

export async function eliminarGaleriaItem(id) {
  await request(`${BASE_URL}/galeria/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ actorRoles: obtenerActorRoles() }),
  });
  clearInfoCache();
  return true;
}

export async function obtenerHero() {
  return getCache("hero") ?? setCache("hero", request(`${BASE_URL}/hero`));
}

export async function obtenerNavbar() {
  return getCache("navbar") ?? setCache("navbar", request(`${BASE_URL}/navbar`));
}

export async function actualizarNavbar(cambios) {
  const result = await request(`${BASE_URL}/navbar`, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });
  clearInfoCache();
  return result;
}

export async function obtenerFooter() {
  return getCache("footer") ?? setCache("footer", request(`${BASE_URL}/footer`));
}

export async function actualizarFooter(cambios) {
  const result = await request(`${BASE_URL}/footer`, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });
  clearInfoCache();
  return result;
}

export async function obtenerEnlaces(seccion) {
  const key = `enlaces:${seccion || "all"}`;
  const query = seccion ? `?seccion=${encodeURIComponent(seccion)}` : "";
  const promise = request(`${BASE_URL}/enlaces${query}`).then((data) => (Array.isArray(data) ? data : []));
  return getCache(key) ?? setCache(key, promise);
}

export async function obtenerInformacionSobreNosotros() {
  const [historia, mission, vision, gallery] = await Promise.all([
    obtenerSeccion("historia").catch(() => ({})),
    obtenerSeccion("mission").catch(() => ({})),
    obtenerSeccion("vision").catch(() => ({})),
    obtenerSeccion("gallery").catch(() => []),
  ]);

  return {
    historia: historia ?? {},
    mission: mission ?? {},
    vision: vision ?? {},
    gallery: Array.isArray(gallery) ? gallery : [],
  };
}