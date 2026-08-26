import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/activos-fijos`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

function toBoolean(value) {
  if (value === undefined || value === null || value === false || value === "false") return false;
  if (value === true || value === "true") return true;
  return Boolean(value);
}

export function normalizarActivoFijo(activo) {
  const id = firstDefined(activo, ["id", "Id"]);
  const codigo = firstDefined(activo, ["codigo", "Codigo"]);
  if (id === undefined || id === null || !codigo) return null;

  const rawValor = firstDefined(activo, ["valorEnLibro", "ValorEnLibro"]);
  const valorEnLibro = rawValor === undefined || rawValor === null ? 0 : Number(rawValor);
  const fechaCompra = firstDefined(activo, ["fechaCompra", "FechaCompra"]);

  return {
    id: String(id),
    codigo: String(codigo).trim(),
    nombre: String(firstDefined(activo, ["nombre", "Nombre"]) || "").trim(),
    modelo: String(firstDefined(activo, ["modelo", "Modelo"]) || "").trim(),
    numeroSerie: String(firstDefined(activo, ["numeroSerie", "NumeroSerie"]) || "").trim(),
    fechaCompra: fechaCompra ? String(fechaCompra).slice(0, 10) : "",
    valorEnLibro: Number.isFinite(valorEnLibro) ? valorEnLibro : 0,
    codigoProyecto: String(firstDefined(activo, ["codigoProyecto", "CodigoProyecto"]) || "").trim(),
    nombreCompleto: String(firstDefined(activo, ["nombreCompleto", "NombreCompleto"]) || "").trim(),
    descripcionResponsable: String(
      firstDefined(activo, ["descripcionResponsable", "DescripcionResponsable"]) || "",
    ).trim(),
    descripcionProyecto: String(
      firstDefined(activo, ["descripcionProyecto", "DescripcionProyecto"]) || "",
    ).trim(),
    activo: toBoolean(firstDefined(activo, ["activo", "Activo"]) ?? true),
  };
}

function responseList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function obtenerActivosFijos({ incluirInactivos = true } = {}) {
  const query = incluirInactivos ? "?incluirInactivos=true" : "";
  const data = await apiRequest(`${BASE_URL}${query}`, {
    errorPrefix: "Error en activos fijos",
    timeoutMessage: "Tiempo de espera agotado al consultar activos fijos.",
  });
  return responseList(data).map(normalizarActivoFijo).filter(Boolean);
}

export async function crearActivoFijo(payload) {
  const creado = await apiRequest(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    errorPrefix: "Error en activos fijos",
  });
  return normalizarActivoFijo(creado);
}

export async function actualizarActivoFijo(id, payload) {
  const actualizado = await apiRequest(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    errorPrefix: "Error en activos fijos",
  });
  return normalizarActivoFijo(actualizado);
}

export async function cambiarEstadoActivoFijo(id, activo) {
  const actualizado = await apiRequest(`${BASE_URL}/${encodeURIComponent(id)}/estado`, {
    method: "PUT",
    body: JSON.stringify({ activo }),
    errorPrefix: "Error en activos fijos",
  });
  return normalizarActivoFijo(actualizado);
}
