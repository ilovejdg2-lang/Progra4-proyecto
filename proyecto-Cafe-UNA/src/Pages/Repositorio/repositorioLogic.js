import { esCorreoValido, MENSAJE_CORREO_INVALIDO } from "../../lib/correo";

/** Sort values the backend (`GET /documentos/publicos`) understands, in UI order. */
export const ORDENES = ["recientes", "descargas", "az"];

export function normalizarOrden(valor) {
  return ORDENES.includes(valor) ? valor : "recientes";
}

/** Public categories that have at least one public document, with their count. */
export function categoriasConConteo(facetas) {
  const lista = Array.isArray(facetas?.categorias) ? facetas.categorias : [];
  return lista
    .map((c) => ({ nombre: c.nombre, count: Number(c.count) || 0 }))
    .filter((c) => c.nombre && c.count > 0);
}

/** Short file-type label for the row tile (PDF, DOC, XLS, IMG, ZIP or the extension). */
export function etiquetaTipoArchivo({ nombreOriginal = "", mimeType = "" } = {}) {
  const ext = (String(nombreOriginal).split(".").pop() || "").toLowerCase();
  const mime = String(mimeType).toLowerCase();
  if (ext === "pdf" || mime.includes("pdf")) return "PDF";
  if (["doc", "docx"].includes(ext) || mime.includes("word") || mime.includes("msword")) return "DOC";
  if (["xls", "xlsx", "csv"].includes(ext) || mime.includes("sheet") || mime.includes("excel")) return "XLS";
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) || mime.startsWith("image/")) return "IMG";
  if (["zip", "rar", "7z"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) return "ZIP";
  if (ext && ext !== String(nombreOriginal).toLowerCase() && ext.length <= 4) return ext.toUpperCase();
  return "ARCH";
}

/** Parts of the muted meta line: author, category, year, downloads (missing parts omitted). */
export function metaDocumento(doc, { esAdmin = false } = {}) {
  const partes = [];
  if (esAdmin && doc.esPrivado) partes.push("Privado");
  if (doc.autor) partes.push(doc.autor);
  if (doc.categoria) partes.push(doc.categoria);
  if (doc.anio) partes.push(String(doc.anio));
  const descargas = Number(doc.descargasCount) || 0;
  if (descargas > 0) partes.push(`${descargas} ${descargas === 1 ? "descarga" : "descargas"}`);
  return partes;
}

export function filtrosActivos(filtros) {
  return Boolean(String(filtros.buscar || "").trim()) || (filtros.categoria || "todas") !== "todas";
}

/**
 * Returns the first validation message (empty string when the form is valid).
 * `esSolicitud` is the access-request mode; otherwise it is a new contribution.
 */
export function validarEnvio(valores, { esSolicitud }) {
  if (!String(valores.titulo || "").trim()) return "Indica el título o tema del documento.";
  if (!esSolicitud && !String(valores.categoria || "").trim()) return "Elige el tema del documento.";
  if (!esSolicitud && !valores.archivo) return "Adjunta el archivo del documento.";
  if (!String(valores.nombre || "").trim()) return "Ingresa tu nombre completo.";
  if (!esCorreoValido(valores.correo)) return MENSAJE_CORREO_INVALIDO;
  if (esSolicitud && !String(valores.motivo || "").trim()) return "Cuéntanos para qué lo necesitas.";
  return "";
}

/** Page numbers around the current one, with "…" gaps: 1 … 4 5 6 … 9. */
export function obtenerNumerosPagina(paginaActual, totalPaginas) {
  const numeros = new Set([1, totalPaginas, paginaActual - 1, paginaActual, paginaActual + 1]);
  const ordenados = [...numeros].filter((n) => n >= 1 && n <= totalPaginas).sort((a, b) => a - b);
  const salida = [];
  ordenados.forEach((n, i) => {
    if (i > 0 && n - ordenados[i - 1] > 1) salida.push("...");
    salida.push(n);
  });
  return salida;
}
