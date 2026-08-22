import { createDomainRequest, createListCache } from "./serviceHelpers";

const BASE_URL = `${import.meta.env.BACKEND_URL}/auditoria`;
const CACHE_TTL_MS = 2 * 60 * 1000;
const cache = createListCache(CACHE_TTL_MS);
const request = createDomainRequest(
  "Error en auditor\u00eda",
  "Tiempo de espera agotado al consultar auditor\u00eda.",
);

export async function obtenerAuditoria({ force = false } = {}) {
  const cached = cache.get(force);
  if (cached) return cached;

  return cache.setPromise(request(BASE_URL));
}
