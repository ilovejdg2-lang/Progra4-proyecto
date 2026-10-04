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

function capitalizarTexto(str = "") {
  const limpio = String(str || "").trim();
  if (!limpio) return "";
  if (limpio === limpio.toUpperCase() && limpio.length > 2) {
    return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
  }
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function claveNormalizada(str = "") {
  return String(str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

let catalogoPublicoCache = null;
let categoriasPublicasCache = null;
let catalogoCacheTimestamp = 0;
const CATALOGO_CACHE_TTL_MS = 60 * 1000;

export function invalidarCacheDocumentos() {
  catalogoPublicoCache = null;
  categoriasPublicasCache = null;
  catalogoCacheTimestamp = 0;
  cache.clear();
}

export function normalizarDoc(d) {
  if (!d) return null;
  return {
    ...d,
    id: d.id ?? d.Id,
    titulo: d.titulo ?? d.Titulo,
    descripcion: d.descripcion ?? d.Descripcion ?? "",
    categoria: d.categoria ?? d.Categoria ?? "General",
    subcategoria: d.subcategoria ?? d.Subcategoria ?? "",
    nombreOriginal: d.nombreOriginal ?? d.NombreOriginal ?? d.nombreArchivo ?? d.NombreArchivo ?? "",
    mimeType: d.mimeType ?? d.MimeType ?? "application/pdf",
    tamanoBytes: Number(d.tamanoBytes ?? d.TamanoBytes ?? 0),
    esPrivado: Boolean(d.esPrivado ?? d.EsPrivado),
    visibilidad: d.visibilidad ?? d.Visibilidad ?? (d.esPrivado || d.EsPrivado ? "Privado" : "Publico"),
    autor: d.autor ?? d.Autor ?? "Proyecto Café-UNA",
    version: d.version ?? d.Version ?? "1.0",
    palabrasClave: d.palabrasClave ?? d.PalabrasClave ?? "",
    descargasCount: Number(d.descargasCount ?? d.DescargasCount ?? 0),
    vistasCount: Number(d.vistasCount ?? d.VistasCount ?? 0),
    fechaPublicacion: d.fechaPublicacion ?? d.createdAt ?? d.CreatedAt,
    paginas: d.paginas ?? d.Paginas,
    etiquetas: Array.isArray(d.etiquetas ?? d.Etiquetas)
      ? d.etiquetas ?? d.Etiquetas
      : typeof (d.etiquetas ?? d.Etiquetas) === "string"
      ? (d.etiquetas ?? d.Etiquetas).split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    idioma: d.idioma ?? d.Idioma ?? "es",
    anio:
      Number(d.anio ?? d.Anio) ||
      (d.fechaPublicacion || d.createdAt || d.CreatedAt
        ? new Date(d.fechaPublicacion || d.createdAt || d.CreatedAt).getFullYear()
        : 2026),
  };
}

/**
 * Calcula facetas temáticas, accesos rápidos y estadísticas a partir del catálogo
 */
export function calcularFacetasYEstadisticas(documentos = [], esAdmin = false, catalogoCategorias = []) {
  const categoriasMap = new Map();
  const subcategoriasMap = new Map();
  const aniosMap = new Map();
  const autoresMap = new Map();
  const idiomasMap = new Map();
  const visibilidadesMap = new Map();
  const etiquetasMap = new Map();
  const tiposArchivoMap = {
    pdf: 0,
    word: 0,
    excel: 0,
    imagen: 0,
    comprimido: 0,
  };

  // Pre-poblar todas las categorías del catálogo para que nunca desaparezcan de la barra lateral
  (catalogoCategorias || []).forEach((cat) => {
    const rawNombre = (cat.nombre || cat.Nombre || "").trim();
    if (rawNombre) {
      const key = claveNormalizada(rawNombre);
      categoriasMap.set(key, {
        nombre: rawNombre,
        count: 0,
      });
    }
  });

  let totalDescargas = 0;
  let totalVistas = 0;
  let minAnio = 2026;
  let maxAnio = 2026;

  let novedadesCount = 0;
  let popularesCount = 0;
  let destacadosCount = 0;

  const ahora = Date.now();
  const sesentaDiasMs = 60 * 24 * 60 * 60 * 1000;

  documentos.forEach((doc) => {
    totalDescargas += Number(doc.descargasCount || doc.DescargasCount || 0);
    totalVistas += Number(doc.vistasCount || doc.VistasCount || 0);

    // Categoría: normalización y deduplicación inteligente
    const rawCat = (doc.categoria || doc.Categoria || "General").trim();
    if (rawCat) {
      const key = claveNormalizada(rawCat);
      const existente = categoriasMap.get(key);
      if (existente) {
        existente.count += 1;
      } else {
        const nombreLimpio = capitalizarTexto(rawCat);
        categoriasMap.set(key, { nombre: nombreLimpio, count: 1 });
      }
    }

    // Subcategoría: normalización y deduplicación
    const rawSub = (doc.subcategoria || doc.Subcategoria || "").trim();
    if (rawSub) {
      const key = claveNormalizada(rawSub);
      const nombreLimpio = capitalizarTexto(rawSub);
      const existente = subcategoriasMap.get(key);
      if (existente) {
        existente.count += 1;
      } else {
        subcategoriasMap.set(key, {
          nombre: nombreLimpio,
          categoria: capitalizarTexto(rawCat),
          count: 1,
        });
      }
    }

    // Año
    const anio =
      Number(doc.anio || doc.Anio) ||
      (doc.fechaPublicacion || doc.createdAt || doc.CreatedAt
        ? new Date(doc.fechaPublicacion || doc.createdAt || doc.CreatedAt).getFullYear()
        : 2026);
    if (anio) {
      aniosMap.set(anio, (aniosMap.get(anio) || 0) + 1);
      if (anio < minAnio) minAnio = anio;
      if (anio > maxAnio) maxAnio = anio;
    }

    // Autor: normalización y deduplicación
    const rawAutor = (doc.autor || doc.Autor || "").trim();
    if (rawAutor) {
      const key = claveNormalizada(rawAutor);
      const existente = autoresMap.get(key);
      if (existente) {
        existente.count += 1;
      } else {
        autoresMap.set(key, { autor: rawAutor, count: 1 });
      }
    }

    // Idioma
    const idioma = (doc.idioma || doc.Idioma || "es").trim().toLowerCase();
    idiomasMap.set(idioma, (idiomasMap.get(idioma) || 0) + 1);

    // Visibilidad (solo si es admin)
    const esPriv = Boolean(doc.esPrivado || doc.EsPrivado);
    const vis = doc.visibilidad || doc.Visibilidad || (esPriv ? "Privado" : "Publico");
    if (esAdmin) {
      visibilidadesMap.set(vis, (visibilidadesMap.get(vis) || 0) + 1);
    }

    // Etiquetas
    const rawTags = doc.etiquetas || doc.Etiquetas;
    const tagList = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === "string"
      ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    tagList.forEach((tag) => {
      const tagLimpia = tag.trim();
      if (tagLimpia) {
        const key = claveNormalizada(tagLimpia);
        const existente = etiquetasMap.get(key);
        if (existente) {
          existente.count += 1;
        } else {
          etiquetasMap.set(key, { etiqueta: tagLimpia, count: 1 });
        }
      }
    });

    // Tipo Archivo
    const nombre = (doc.nombreOriginal || doc.NombreOriginal || doc.nombreArchivo || doc.NombreArchivo || "").toLowerCase();
    const mime = (doc.mimeType || doc.MimeType || "").toLowerCase();
    if (nombre.endsWith(".pdf") || mime.includes("pdf")) tiposArchivoMap.pdf++;
    else if (nombre.endsWith(".doc") || nombre.endsWith(".docx") || mime.includes("word")) tiposArchivoMap.word++;
    else if (nombre.endsWith(".xls") || nombre.endsWith(".xlsx") || nombre.endsWith(".csv") || mime.includes("excel") || mime.includes("sheet")) tiposArchivoMap.excel++;
    else if (nombre.endsWith(".jpg") || nombre.endsWith(".jpeg") || nombre.endsWith(".png") || nombre.endsWith(".webp") || mime.startsWith("image/")) tiposArchivoMap.imagen++;
    else if (nombre.endsWith(".zip") || nombre.endsWith(".rar") || nombre.endsWith(".7z") || mime.includes("zip") || mime.includes("compressed")) tiposArchivoMap.comprimido++;

    // Accesos Rápidos
    const fecha = doc.fechaPublicacion || doc.createdAt || doc.CreatedAt;
    if (!fecha || (ahora - new Date(fecha).getTime() <= sesentaDiasMs)) {
      novedadesCount++;
    }
    const dCount = Number(doc.descargasCount || doc.DescargasCount || 0);
    const vCount = Number(doc.vistasCount || doc.VistasCount || 0);
    if (dCount > 0) popularesCount++;
    if (dCount > 0 || vCount > 0) destacadosCount++;
  });

  return {
    facetas: {
      categorias: Array.from(categoriasMap.values())
        .sort((a, b) => b.count - a.count),
      subcategorias: Array.from(subcategoriasMap.values())
        .sort((a, b) => b.count - a.count),
      anios: Array.from(aniosMap.entries())
        .map(([anio, count]) => ({ anio, count }))
        .sort((a, b) => b.anio - a.anio),
      minAnio,
      maxAnio,
      tiposArchivo: [
        { tipo: "pdf", label: "PDF", count: tiposArchivoMap.pdf },
        { tipo: "word", label: "Word (DOC/DOCX)", count: tiposArchivoMap.word },
        { tipo: "excel", label: "Excel (XLSX/CSV)", count: tiposArchivoMap.excel },
        { tipo: "imagen", label: "Imágenes", count: tiposArchivoMap.imagen },
        { tipo: "comprimido", label: "Comprimidos", count: tiposArchivoMap.comprimido },
      ],
      idiomas: Array.from(idiomasMap.entries()).map(([idioma, count]) => ({
        idioma,
        label: idioma === "es" ? "Español" : idioma === "en" ? "English" : idioma.toUpperCase(),
        count,
      })),
      visibilidades: esAdmin
        ? Array.from(visibilidadesMap.entries()).map(([visibilidad, count]) => ({ visibilidad, count }))
        : [],
      autores: Array.from(autoresMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
      etiquetas: Array.from(etiquetasMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      accesosRapidos: {
        todos: documentos.length,
        novedades: novedadesCount || documentos.length,
        populares: popularesCount,
        destacados: destacadosCount,
      },
    },
    estadisticas: {
      totalDocumentos: documentos.length,
      totalCategorias: categoriasMap.size,
      totalDescargas,
      totalVistas,
    },
  };
}

/**
 * Consulta pública y facetada de documentos con filtros, orden y paginación
 */
export async function obtenerDocumentosPublicos(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      params.set(clave, String(valor).trim());
    }
  });

  const user = getActiveSessionUser();
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const query = params.toString();
  const url = query ? `${BASE_URL}/publicos?${query}` : `${BASE_URL}/publicos`;

  const data = await request(url, { headers });

  const esAdmin = Array.isArray(user?.roles)
    ? user.roles.some((r) => ["admin", "superadmin"].includes(String(r).toLowerCase()))
    : ["admin", "superadmin"].includes(String(user?.role || user?.rol || "").toLowerCase());

  // Si el backend retornó estructura completa con items y facetas, enriquecer y retornar
  if (
    data &&
    typeof data === "object" &&
    Array.isArray(data.items) &&
    data.facetas &&
    Array.isArray(data.facetas.categorias) &&
    data.facetas.categorias.length > 0
  ) {
    const rawAccesos = data.facetas.accesosRapidos;
    const accesosRapidos = {
      todos: rawAccesos?.todos ?? (data.total || data.items.length),
      novedades: rawAccesos?.novedades ?? data.items.length,
      populares:
        rawAccesos?.populares ??
        data.items.filter((d) => (d.descargasCount || d.DescargasCount || 0) > 0)
          .length,
      destacados:
        rawAccesos?.destacados ??
        data.items.filter(
          (d) =>
            (d.descargasCount || d.DescargasCount || 0) > 0 ||
            (d.vistasCount || d.VistasCount || 0) > 0,
        ).length,
    };

    return {
      ...data,
      items: data.items,
      facetas: {
        ...data.facetas,
        accesosRapidos,
      },
    };
  }

  // Fallback transparente: cálculo inteligente de facetas y filtrado cliente
  const todosDocs = normalizarLista(data).map(normalizarDoc);

  // Asegurar que el catálogo completo de categorías y documentos esté disponible para facetas globales
  const ahora = Date.now();
  const tieneFiltros = Boolean(
    (filtros.categoria && filtros.categoria !== "todas") ||
      filtros.subcategoria ||
      (filtros.buscar && filtros.buscar.trim()) ||
      (filtros.accesoRapido && filtros.accesoRapido !== "todos") ||
      (filtros.tipoArchivo && filtros.tipoArchivo !== "todos") ||
      filtros.anioDesde ||
      filtros.anioHasta ||
      filtros.autor ||
      (filtros.idioma && filtros.idioma !== "todos") ||
      filtros.etiquetas,
  );

  if (!tieneFiltros && todosDocs.length > 0) {
    catalogoPublicoCache = todosDocs;
    catalogoCacheTimestamp = ahora;
  }

  if (
    !categoriasPublicasCache ||
    !catalogoPublicoCache ||
    ahora - catalogoCacheTimestamp > CATALOGO_CACHE_TTL_MS
  ) {
    try {
      const [rawGlobalDocs, rawCats] = await Promise.all([
        !catalogoPublicoCache || ahora - catalogoCacheTimestamp > CATALOGO_CACHE_TTL_MS
          ? request(`${BASE_URL}/publicos`, { headers }).catch(() => null)
          : null,
        !categoriasPublicasCache
          ? request(`${BASE_URL}/categorias`).catch(() => null)
          : null,
      ]);

      if (rawGlobalDocs) {
        catalogoPublicoCache = normalizarLista(rawGlobalDocs).map(normalizarDoc);
        catalogoCacheTimestamp = ahora;
      }
      if (rawCats) {
        categoriasPublicasCache = normalizarLista(rawCats)
          .map(normalizarCategoriaDoc)
          .filter((c) => c && c.nombre);
      }
    } catch (err) {
      console.warn("No se pudo precargar catálogo para facetas completas:", err);
    }
  }

  const docsParaFacetas =
    catalogoPublicoCache && catalogoPublicoCache.length >= todosDocs.length
      ? catalogoPublicoCache
      : todosDocs;

  const { facetas, estadisticas } = calcularFacetasYEstadisticas(
    docsParaFacetas,
    esAdmin,
    categoriasPublicasCache || [],
  );

  // Filtrado local seguro
  let filtrados = todosDocs.slice();

  // Regla estricta: roles no admin jamás ven privados
  if (!esAdmin) {
    filtrados = filtrados.filter((d) => !d.esPrivado && d.visibilidad !== "Privado");
  }

  // Categoría
  if (filtros.categoria && filtros.categoria !== "todas") {
    const catFiltro = claveNormalizada(filtros.categoria);
    filtrados = filtrados.filter(
      (d) => claveNormalizada(d.categoria || "") === catFiltro,
    );
  }

  // Subcategoría
  if (filtros.subcategoria) {
    const subFiltro = claveNormalizada(filtros.subcategoria);
    filtrados = filtrados.filter(
      (d) => claveNormalizada(d.subcategoria || "") === subFiltro,
    );
  }

  // Búsqueda textual
  if (filtros.buscar && filtros.buscar.trim()) {
    const term = filtros.buscar.trim().toLowerCase();
    filtrados = filtrados.filter((d) => {
      const titulo = (d.titulo || "").toLowerCase();
      const desc = (d.descripcion || "").toLowerCase();
      const autor = (d.autor || "").toLowerCase();
      const tags = (d.etiquetas || []).join(" ").toLowerCase();
      const claves = (d.palabrasClave || "").toLowerCase();
      return (
        titulo.includes(term) ||
        desc.includes(term) ||
        autor.includes(term) ||
        tags.includes(term) ||
        claves.includes(term)
      );
    });
  }

  // Accesos rápidos
  if (filtros.accesoRapido && filtros.accesoRapido !== "todos") {
    if (filtros.accesoRapido === "populares") {
      filtrados = filtrados.filter((d) => d.descargasCount > 0);
      filtrados.sort((a, b) => b.descargasCount - a.descargasCount);
    } else if (filtros.accesoRapido === "destacados") {
      filtrados = filtrados.filter(
        (d) => d.descargasCount > 0 || d.vistasCount > 0,
      );
      filtrados.sort(
        (a, b) => b.descargasCount + b.vistasCount - (a.descargasCount + a.vistasCount),
      );
    } else if (filtros.accesoRapido === "novedades") {
      filtrados.sort(
        (a, b) =>
          new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0),
      );
    }
  }

  // Tipo de archivo
  if (filtros.tipoArchivo && filtros.tipoArchivo !== "todos") {
    const t = filtros.tipoArchivo.toLowerCase();
    filtrados = filtrados.filter((d) => {
      const nombre = (d.nombreOriginal || "").toLowerCase();
      const mime = (d.mimeType || "").toLowerCase();
      if (t === "pdf") return nombre.endsWith(".pdf") || mime.includes("pdf");
      if (t === "word") return nombre.endsWith(".doc") || nombre.endsWith(".docx") || mime.includes("word");
      if (t === "excel") return nombre.endsWith(".xls") || nombre.endsWith(".xlsx") || nombre.endsWith(".csv") || mime.includes("excel") || mime.includes("sheet");
      if (t === "imagen") return nombre.endsWith(".jpg") || nombre.endsWith(".jpeg") || nombre.endsWith(".png") || nombre.endsWith(".webp") || mime.startsWith("image/");
      if (t === "comprimido") return nombre.endsWith(".zip") || nombre.endsWith(".rar") || nombre.endsWith(".7z") || mime.includes("zip");
      return true;
    });
  }

  // Años
  if (filtros.anioDesde) {
    const desde = Number(filtros.anioDesde);
    filtrados = filtrados.filter((d) => d.anio >= desde);
  }
  if (filtros.anioHasta) {
    const hasta = Number(filtros.anioHasta);
    filtrados = filtrados.filter((d) => d.anio <= hasta);
  }

  // Autor
  if (filtros.autor) {
    const autFiltro = filtros.autor.toLowerCase();
    filtrados = filtrados.filter((d) => (d.autor || "").toLowerCase() === autFiltro);
  }

  // Idioma
  if (filtros.idioma && filtros.idioma !== "todos") {
    const idioFiltro = filtros.idioma.toLowerCase();
    filtrados = filtrados.filter((d) => (d.idioma || "es").toLowerCase() === idioFiltro);
  }

  // Visibilidad
  if (esAdmin && filtros.visibilidad && filtros.visibilidad !== "todas") {
    const visFiltro = filtros.visibilidad.toLowerCase();
    filtrados = filtrados.filter((d) => (d.visibilidad || "").toLowerCase() === visFiltro);
  }

  // Etiquetas
  if (filtros.etiquetas) {
    const tagsBuscados = filtros.etiquetas
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tagsBuscados.length > 0) {
      filtrados = filtrados.filter((d) =>
        (d.etiquetas || []).some((t) => tagsBuscados.includes(t.toLowerCase())),
      );
    }
  }

  // Orden
  if (filtros.orden) {
    if (filtros.orden === "antiguos") {
      filtrados.sort(
        (a, b) =>
          new Date(a.fechaPublicacion || 0) - new Date(b.fechaPublicacion || 0),
      );
    } else if (filtros.orden === "populares") {
      filtrados.sort((a, b) => b.descargasCount - a.descargasCount);
    } else if (filtros.orden === "titulo_asc") {
      filtrados.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
    } else if (filtros.orden === "titulo_desc") {
      filtrados.sort((a, b) => (b.titulo || "").localeCompare(a.titulo || ""));
    } else {
      filtrados.sort(
        (a, b) =>
          new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0),
      );
    }
  }

  const limite = parseInt(filtros.limite || "12", 10) || 12;
  const pagina = parseInt(filtros.pagina || "1", 10) || 1;
  const total = filtrados.length;
  const totalPaginas = Math.ceil(total / limite) || 1;
  const start = (pagina - 1) * limite;
  const paginados = filtrados.slice(start, start + limite);

  return {
    items: paginados,
    total,
    pagina,
    limite,
    totalPaginas,
    facetas,
    estadisticas,
  };
}

/**
 * Ficha de documento con metadatos completos y documentos relacionados
 */
export async function obtenerDocumentoDetalle(id) {
  const user = getActiveSessionUser();
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  return request(`${BASE_URL}/${id}/detalle`, { headers });
}

/**
 * Registra una vista de documento e incrementa el contador
 */
export async function registrarVistaDocumento(id) {
  const user = getActiveSessionUser();
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  return request(`${BASE_URL}/${id}/vista`, { method: "POST", headers });
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
  invalidarCacheDocumentos();
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
