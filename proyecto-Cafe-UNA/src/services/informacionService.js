import { invalidateAllPageCaches } from "../lib/pageDataCache";
import { cacheBrandLogos } from "../lib/brandLogoCache";
import { createDomainRequest, createKeyedCache } from "./serviceHelpers";

const BASE_URL = `${import.meta.env.BACKEND_URL}/informacion`;
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = createKeyedCache(CACHE_TTL_MS);

function clearInfoCache() {
  cache.clear();
  invalidateAllPageCaches();
}

/** Limpia la caché HTTP de información (hero, secciones, etc.). */
export function clearInformacionHttpCache() {
  cache.clear();
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
  const data = await cache.get("navbar", () => domainRequest(`${BASE_URL}/navbar`));
  cacheBrandLogos({
    logoUrl: data?.logoUrl ?? data?.LogoUrl,
    logoClaroUrl: data?.logoClaroUrl ?? data?.LogoClaroUrl,
  });
  return data;
}

export async function actualizarNavbar(cambios) {
  const result = await domainRequest(`${BASE_URL}/navbar`, {
    method: "PATCH",
    data: cambios,
  });
  clearInfoCache();
  cacheBrandLogos({
    logoUrl: result?.logoUrl ?? result?.LogoUrl ?? cambios?.logoUrl,
    logoClaroUrl: result?.logoClaroUrl ?? result?.LogoClaroUrl ?? cambios?.logoClaroUrl,
  });
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

export async function obtenerFaqInicio() {
  return cache.get("faq-inicio", () =>
    domainRequest(`${BASE_URL}/faq-inicio`).then((data) => (Array.isArray(data) ? data : [])),
  );
}

export async function crearFaqInicio(item) {
  const result = await domainRequest(`${BASE_URL}/faq-inicio`, {
    method: "POST",
    data: item,
  });
  clearInfoCache();
  return result;
}

export async function actualizarFaqInicio(id, cambios) {
  const result = await domainRequest(`${BASE_URL}/faq-inicio/${id}`, {
    method: "PUT",
    data: cambios,
  });
  clearInfoCache();
  return result;
}

export async function eliminarFaqInicio(id) {
  await domainRequest(`${BASE_URL}/faq-inicio/${id}`, {
    method: "DELETE",
  });
  clearInfoCache();
  return true;
}

export async function obtenerEquipo() {
  return cache.get("equipo", () =>
    domainRequest(`${BASE_URL}/equipo`).then((data) => (Array.isArray(data) ? data : [])),
  );
}

export async function crearMiembroEquipo(miembro) {
  const result = await domainRequest(`${BASE_URL}/equipo`, {
    method: "POST",
    data: miembro,
  });
  clearInfoCache();
  return result;
}

export async function actualizarMiembroEquipo(id, cambios) {
  const result = await domainRequest(`${BASE_URL}/equipo/${id}`, {
    method: "PUT",
    data: cambios,
  });
  clearInfoCache();
  return result;
}

export async function eliminarMiembroEquipo(id) {
  await domainRequest(`${BASE_URL}/equipo/${id}`, {
    method: "DELETE",
  });
  clearInfoCache();
  return true;
}

export async function subirImagenInformacion(archivo) {
  const form = new FormData();
  form.append("imagen", archivo);
  const resultado = await domainRequest(`${BASE_URL}/imagenes`, {
    method: "POST",
    body: form,
  });
  const url = String(resultado?.url ?? resultado?.Url ?? "").trim();
  if (!url) throw new Error("No se pudo subir la imagen.");
  return url;
}

export async function obtenerHistoriaCompleta() {
  return cache.get("historia-completa", () => domainRequest(`${BASE_URL}/historia-completa`));
}

export async function actualizarHistoriaCompleta(contenido) {
  const result = await domainRequest(`${BASE_URL}/historia-completa`, {
    method: "PUT",
    data: contenido,
  });
  clearInfoCache();
  return result;
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
      equipo: Array.isArray(bulk?.equipo) ? bulk.equipo : [],
    };
  });
}

export const DEFAULT_PRODUCTORES_HERO = {
  eyebrow: "PRODUCTORES LOCALES",
  eyebrowEn: "LOCAL PRODUCERS",
  title: "Da a conocer tu emprendimiento",
  titleEn: "Promote your venture",
  description: "Conecta con amantes del café y dale visibilidad a tus productos en nuestro mapa interactivo.",
  descriptionEn: "Connect with coffee lovers and give visibility to your products on our interactive map.",
  image: "https://i.ibb.co/LX9p9NmQ/finca-santa-lucia-mapa-con-nombres-1792378976823.jpg",
  linkText: "Enviar propuesta",
  linkTextEn: "Submit proposal",
  linkUrl: "/productores/propuesta",
  secondaryButtonText: "Explorar mapa",
  secondaryButtonTextEn: "Explore map",
  secondaryButtonUrl: "/productores",
  tertiaryButtonText: "",
  tertiaryButtonTextEn: "",
  tertiaryButtonUrl: "",
  footerText: "+30 Ubicaciones activas",
  footerTextEn: "+30 Active locations",
};

export function normalizarProductoresHero(data) {
  if (!data || typeof data !== "object") return { ...DEFAULT_PRODUCTORES_HERO };

  const getStr = (pascal, camel, defecto) => {
    const val = data[pascal] ?? data[camel];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
    return defecto;
  };

  return {
    eyebrow: getStr("Eyebrow", "eyebrow", DEFAULT_PRODUCTORES_HERO.eyebrow),
    eyebrowEn: getStr("EyebrowEn", "eyebrowEn", DEFAULT_PRODUCTORES_HERO.eyebrowEn),
    title: getStr("Title", "title", DEFAULT_PRODUCTORES_HERO.title),
    titleEn: getStr("TitleEn", "titleEn", DEFAULT_PRODUCTORES_HERO.titleEn),
    description: getStr("Description", "description", DEFAULT_PRODUCTORES_HERO.description),
    descriptionEn: getStr("DescriptionEn", "descriptionEn", DEFAULT_PRODUCTORES_HERO.descriptionEn),
    image: getStr("Image", "image", DEFAULT_PRODUCTORES_HERO.image),
    linkText: getStr("LinkText", "linkText", DEFAULT_PRODUCTORES_HERO.linkText),
    linkTextEn: getStr("LinkTextEn", "linkTextEn", DEFAULT_PRODUCTORES_HERO.linkTextEn),
    linkUrl: getStr("LinkUrl", "linkUrl", DEFAULT_PRODUCTORES_HERO.linkUrl),
    secondaryButtonText: getStr("SecondaryButtonText", "secondaryButtonText", DEFAULT_PRODUCTORES_HERO.secondaryButtonText),
    secondaryButtonTextEn: getStr("SecondaryButtonTextEn", "secondaryButtonTextEn", DEFAULT_PRODUCTORES_HERO.secondaryButtonTextEn),
    secondaryButtonUrl: getStr("SecondaryButtonUrl", "secondaryButtonUrl", DEFAULT_PRODUCTORES_HERO.secondaryButtonUrl),
    tertiaryButtonText: getStr("TertiaryButtonText", "tertiaryButtonText", DEFAULT_PRODUCTORES_HERO.tertiaryButtonText),
    tertiaryButtonTextEn: getStr("TertiaryButtonTextEn", "tertiaryButtonTextEn", DEFAULT_PRODUCTORES_HERO.tertiaryButtonTextEn),
    tertiaryButtonUrl: getStr("TertiaryButtonUrl", "tertiaryButtonUrl", DEFAULT_PRODUCTORES_HERO.tertiaryButtonUrl),
    footerText: getStr("FooterText", "footerText", DEFAULT_PRODUCTORES_HERO.footerText),
    footerTextEn: getStr("FooterTextEn", "footerTextEn", DEFAULT_PRODUCTORES_HERO.footerTextEn),
  };
}

export async function obtenerProductoresHero() {
  try {
    const res = await obtenerSeccion("productores");
    return normalizarProductoresHero(res);
  } catch {
    return { ...DEFAULT_PRODUCTORES_HERO };
  }
}

export async function actualizarProductoresHero(cambios) {
  const result = await actualizarSeccion("productores", cambios);
  return normalizarProductoresHero(result);
}