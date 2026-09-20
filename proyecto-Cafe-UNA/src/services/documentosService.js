import { apiRequest } from "./apiClient";
import { createDomainRequest, createListCache } from "./serviceHelpers";
import { getActiveSessionUser } from "./sessionService";

const BACKEND_URL = import.meta.env.BACKEND_URL || "http://localhost:3000";
const BASE_URL = `${BACKEND_URL}/documentos`;
const CATEGORIAS_URL = `${BACKEND_URL}/categorias`;

const CACHE_TTL_MS = 3 * 60 * 1000;
const cache = createListCache(CACHE_TTL_MS);

const request = createDomainRequest(
  "Error en repositorio de documentos",
  "Tiempo de espera agotado al consultar documentos.",
);

function normalizarLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

/**
 * Consulta pública de documentos con filtros y orden
 */
export async function obtenerDocumentosPublicos(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    const normalizado = String(valor ?? "").trim();
    if (normalizado) params.set(clave, normalizado);
  });

  const query = params.toString();
  const url = query ? `${BASE_URL}/publicos?${query}` : `${BASE_URL}/publicos`;

  const data = await request(url);
  return normalizarLista(data);
}

export function normalizarCategoriaDoc(item) {
  if (!item) return null;
  const id = String(item.id ?? item.Id ?? "");
  const nombre = String(item.nombre ?? item.Nombre ?? "").trim();
  const tipo = String(item.tipo ?? item.Tipo ?? "documento").trim().toLowerCase();
  const padre = String(item.padre ?? item.Padre ?? "").trim();
  const usos = Number(item.usos ?? item.Usos ?? 0) || 0;
  return {
    id,
    Id: id,
    nombre,
    Nombre: nombre,
    tipo,
    Tipo: tipo,
    padre,
    Padre: padre,
    usos,
    Usos: usos,
  };
}

/**
 * Consulta de categorías de documentos para el repositorio
 */
export async function obtenerCategoriasDocumentos() {
  const data = await request(`${BASE_URL}/categorias`);
  const lista = normalizarLista(data);
  return lista.map(normalizarCategoriaDoc).filter((c) => c && c.nombre);
}

/**
 * Solicitud de acceso o envío de propuesta de documento por usuarios
 */
export async function solicitarAccesoDocumento(datos) {
  if (typeof FormData !== "undefined" && datos instanceof FormData) {
    return apiRequest(`${BASE_URL}/solicitar`, {
      method: "POST",
      data: datos,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      errorPrefix: "Error al enviar propuesta de documento",
    });
  }
  return request(`${BASE_URL}/solicitar`, {
    method: "POST",
    data: datos,
  });
}

/**
 * Genera la URL de descarga directa de un documento
 */
export function obtenerUrlDescargaDocumento(id, tokenAuth) {
  const user = getActiveSessionUser();
  const token = tokenAuth || user?.token;
  if (token) {
    return `${BASE_URL}/${id}/descargar?token=${encodeURIComponent(token)}`;
  }
  return `${BASE_URL}/${id}/descargar`;
}

/**
 * Genera la URL de visualización directa en línea de un documento (inline)
 */
export function obtenerUrlVisualizarDocumento(id, tokenAuth) {
  const user = getActiveSessionUser();
  const token = tokenAuth || user?.token;
  if (token) {
    return `${BASE_URL}/${id}/visualizar?token=${encodeURIComponent(token)}`;
  }
  return `${BASE_URL}/${id}/visualizar`;
}

/**
 * Genera la URL de descarga o visualización del archivo aportado por un usuario en su solicitud
 */
export function obtenerUrlArchivoSolicitudAdmin(id, inline = false) {
  const user = getActiveSessionUser();
  const token = user?.token;
  const query = `inline=${Boolean(inline)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  return `${BASE_URL}/admin/solicitudes/${id}/archivo?${query}`;
}

/**
 * Genera la URL de descarga por token temporal de solicitud aprobada
 */
export function obtenerUrlDescargaPorToken(token) {
  return `${BASE_URL}/descarga-token/${encodeURIComponent(token)}`;
}

/**
 * Inicia la descarga en el navegador con un token o sesión
 */
export async function descargarArchivo(id, nombreArchivo = "documento") {
  const user = getActiveSessionUser();
  const url = `${BASE_URL}/${id}/descargar`;
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(
        "Este documento es privado. Debe solicitar acceso para poder descargarlo.",
      );
    }
    throw new Error("No se pudo descargar el archivo solicitado.");
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * =====================================
 * FUNCIONES ADMINISTRATIVAS (PANEL ADMIN)
 * =====================================
 */

/**
 * Listado de documentos para el panel admin
 */
export async function obtenerDocumentosAdmin(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    const normalizado = String(valor ?? "").trim();
    if (normalizado) params.set(clave, normalizado);
  });

  const query = params.toString();
  const url = query
    ? `${BASE_URL}/admin/listado?${query}`
    : `${BASE_URL}/admin/listado`;

  const data = await request(url);
  return normalizarLista(data);
}

/**
 * Crea un documento con subida de archivo
 */
export async function crearDocumentoAdmin(formData) {
  cache.clear();
  return apiRequest(`${BASE_URL}/admin`, {
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    errorPrefix: "Error al subir documento",
  });
}

/**
 * Actualiza un documento y opcionalmente reemplaza su archivo
 */
export async function actualizarDocumentoAdmin(id, formData) {
  cache.clear();
  return apiRequest(`${BASE_URL}/admin/${id}`, {
    method: "PATCH",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    errorPrefix: "Error al actualizar documento",
  });
}

/**
 * Alterna el estado activo / inactivo
 */
export async function cambiarEstadoDocumentoAdmin(id, activo) {
  cache.clear();
  return request(`${BASE_URL}/admin/${id}/estado`, {
    method: "PATCH",
    data: { activo },
  });
}

/**
 * Elimina un documento
 */
export async function eliminarDocumentoAdmin(id) {
  cache.clear();
  return request(`${BASE_URL}/admin/${id}`, {
    method: "DELETE",
  });
}

/**
 * Obtiene métricas y últimas descargas
 */
export async function obtenerEstadisticasDocumentosAdmin() {
  return request(`${BASE_URL}/admin/estadisticas`);
}

/**
 * Exporta catálogo de documentos en CSV
 */
export async function exportarCatalogoDocumentosCsv() {
  const user = getActiveSessionUser();
  const url = `${BASE_URL}/admin/exportar`;
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error("No se pudo exportar el catálogo de documentos.");
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `catalogo-documentos-cafe-una-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/**
 * Obtiene las solicitudes de acceso a documentos privados
 */
export async function obtenerSolicitudesDocumentosAdmin(estado = "todos") {
  const query = estado && estado !== "todos" ? `?estado=${estado}` : "";
  const data = await request(`${BASE_URL}/admin/solicitudes${query}`);
  return normalizarLista(data);
}

/**
 * Resuelve una solicitud (Aprobar o Rechazar)
 */
export async function atenderSolicitudDocumentoAdmin(id, decision) {
  return request(`${BASE_URL}/admin/solicitudes/${id}`, {
    method: "PATCH",
    data: decision,
  });
}

/**
 * Categorías de repositorio
 */
export async function crearCategoriaDocumento({ nombre, padre = "" }) {
  cache.clear();
  const res = await apiRequest(CATEGORIAS_URL, {
    method: "POST",
    data: {
      nombre,
      tipo: "documento",
      padre: padre || "",
    },
    errorPrefix: "Error al crear categoría de documento",
  });
  return normalizarCategoriaDoc(res);
}

export async function eliminarCategoriaDocumento(id) {
  cache.clear();
  return apiRequest(`${CATEGORIAS_URL}/${id}`, {
    method: "DELETE",
    errorPrefix: "Error al eliminar categoría de documento",
  });
}
