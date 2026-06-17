import { invalidateAllPageCaches } from "../lib/pageDataCache";
import { getActiveSessionUser } from "./sessionService";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/informacion`;
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();
const inflight = new Map();

async function cachedGet(key, factory) {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = Promise.resolve()
    .then(factory)
    .then((data) => {
      cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
      inflight.delete(key);
      return data;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise;
}

function clearInfoCache() {
  cache.clear();
  inflight.clear();
  invalidateAllPageCaches();
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
  const method = (options.method || "GET").toUpperCase();
  const isPublicRead = method === "GET";

  return apiRequest(url, {
    ...options,
    skipAuth: isPublicRead ? true : options.skipAuth,
    errorPrefix: "Error en informacion",
    timeoutMessage: "Tiempo de espera agotado al consultar informacion.",
  });
}

export async function obtenerInformacion() {
  return cachedGet("all", () => request(BASE_URL));
}

export async function obtenerSeccion(seccion) {
  return cachedGet(`section:${seccion}`, () =>
    request(`${BASE_URL}/${encodeURIComponent(seccion)}`),
  );
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
  return cachedGet("hero", () => request(`${BASE_URL}/hero`));
}

export async function obtenerNavbar() {
  return cachedGet("navbar", () => request(`${BASE_URL}/navbar`));
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
  return cachedGet("footer", () => request(`${BASE_URL}/footer`));
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
  return cachedGet(key, () =>
    request(`${BASE_URL}/enlaces${query}`).then((data) => (Array.isArray(data) ? data : [])),
  );
}

export async function crearEnlace(item) {
  const result = await request(`${BASE_URL}/enlaces`, {
    method: "POST",
    body: JSON.stringify(item),
  });
  clearInfoCache();
  return result;
}

export async function actualizarEnlace(id, cambios) {
  const result = await request(`${BASE_URL}/enlaces/${id}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
  clearInfoCache();
  return result;
}

export async function eliminarEnlace(id) {
  await request(`${BASE_URL}/enlaces/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ actorRoles: obtenerActorRoles() }),
  });
  clearInfoCache();
  return true;
}

export async function obtenerTarjetasInicio() {
  return cachedGet("tarjetas-inicio", () =>
    request(`${BASE_URL}/tarjetas-inicio`).then((data) => (Array.isArray(data) ? data : [])),
  );
}

export async function actualizarTarjetasInicio(tarjetas) {
  const result = await request(`${BASE_URL}/tarjetas-inicio`, {
    method: "PATCH",
    body: JSON.stringify({ tarjetas }),
  });
  clearInfoCache();
  return Array.isArray(result) ? result : [];
}

export async function obtenerInformacionSobreNosotros() {
  return cachedGet("sobre-nosotros", async () => {
    const bulk = await request(BASE_URL);

    return {
      historia: bulk?.historia ?? {},
      mission: bulk?.mission ?? {},
      vision: bulk?.vision ?? {},
      gallery: Array.isArray(bulk?.gallery) ? bulk.gallery : [],
    };
  });
}