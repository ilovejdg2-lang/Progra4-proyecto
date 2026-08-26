import { createDomainRequest } from "./serviceHelpers";

const BASE_URL = `${import.meta.env.BACKEND_URL}/auditoria`;
const request = createDomainRequest(
  "Error en auditor\u00eda",
  "Tiempo de espera agotado al consultar auditor\u00eda.",
);

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "todos") return;
    if (key === "force") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function obtenerAuditoria(params = {}) {
  return request(`${BASE_URL}${buildQuery(params)}`);
}
