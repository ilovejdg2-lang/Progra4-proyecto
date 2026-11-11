/** SEO técnico para Café UNA (SPA + TanStack Router). */

export const SITE_ORIGIN = "https://cafeuna.app";
export const SITE_NAME = "Café UNA";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/logo.webp`;
export const DEFAULT_LOCALE = "es_CR";

const HOME_TITLE = "Café UNA | Café, productores y productos de Costa Rica";
const HOME_DESCRIPTION =
  "Descubre Café UNA, una plataforma dedicada al café, los productores y los productos de Costa Rica. Explora nuestro catálogo y conoce nuestras iniciativas.";

/** Rutas públicas indexables (canónicas). */
export const PUBLIC_INDEXABLE_PATHS = Object.freeze([
  "/",
  "/AboutUs",
  "/AboutUs/galeria",
  "/AboutUs/historia",
  "/equipo",
  "/productos",
  "/voluntariado",
  "/visitas",
  "/donaciones",
  "/donaciones/necesidades",
  "/productores",
  "/repositorio",
]);

/** Prefijos / rutas que no deben indexarse. */
const NOINDEX_PREFIXES = Object.freeze([
  "/admin",
  "/login",
  "/registro",
  "/verificar-cuenta",
  "/checkout",
  "/perfil",
  "/productores/propuesta",
]);

const ROUTE_SEO = Object.freeze({
  "/": {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    robots: "index,follow",
  },
  "/AboutUs": {
    title: "Sobre nosotros | Café UNA",
    description:
      "Conocé la historia, el equipo y el trabajo de Café UNA en la Universidad Nacional de Costa Rica.",
    robots: "index,follow",
  },
  "/AboutUs/galeria": {
    title: "Galería | Café UNA",
    description: "Imágenes del cafetal, la finca y las actividades de Café UNA.",
    robots: "index,follow",
  },
  "/AboutUs/historia": {
    title: "Historia | Café UNA",
    description: "Recorré la historia de Café UNA y la Finca Experimental Santa Lucía.",
    robots: "index,follow",
  },
  "/equipo": {
    title: "Equipo | Café UNA",
    description: "Conocé al equipo que hace posible Café UNA.",
    robots: "index,follow",
  },
  "/productos": {
    title: "Productos | Café UNA",
    description:
      "Explorá el catálogo de productos de Café UNA: café y más, con puntos de retiro en Costa Rica.",
    robots: "index,follow",
  },
  "/voluntariado": {
    title: "Voluntariado | Café UNA",
    description: "Solicitá participar como persona voluntaria en las actividades de Café UNA.",
    robots: "index,follow",
  },
  "/visitas": {
    title: "Visitas | Café UNA",
    description: "Solicitá una visita a las instalaciones y experiencias de Café UNA.",
    robots: "index,follow",
  },
  "/donaciones": {
    title: "Donaciones | Café UNA",
    description: "Conocé cómo apoyar a Café UNA con donaciones e iniciativas solidarias.",
    robots: "index,follow",
  },
  "/donaciones/necesidades": {
    title: "Necesidades de donación | Café UNA",
    description: "Revisá las necesidades publicadas y apoyá las iniciativas de Café UNA.",
    robots: "index,follow",
  },
  "/productores": {
    title: "Productores | Café UNA",
    description: "Conocé a productores y productoras vinculados con Café UNA.",
    robots: "index,follow",
  },
  "/repositorio": {
    title: "Repositorio | Café UNA",
    description: "Documentos y recursos públicos de Café UNA.",
    robots: "index,follow",
  },
});

const DEFAULT_PUBLIC = Object.freeze({
  title: SITE_NAME,
  description: HOME_DESCRIPTION,
  robots: "index,follow",
});

const DEFAULT_PRIVATE = Object.freeze({
  title: SITE_NAME,
  description: HOME_DESCRIPTION,
  robots: "noindex,nofollow",
});

export function normalizePathname(pathname = "/") {
  let path = String(pathname || "/").split("?")[0].split("#")[0] || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

export function absoluteUrl(pathname = "/") {
  const path = normalizePathname(pathname);
  if (path === "/") return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path}`;
}

/** Convierte rutas relativas del sitio en URL absoluta (OG / JSON-LD). */
export function toAbsoluteAssetUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${SITE_ORIGIN}${raw}`;
  return `${SITE_ORIGIN}/${raw}`;
}

export function isNoIndexPath(pathname) {
  const path = normalizePathname(pathname);
  if (path === "/documentos") return false;
  return NOINDEX_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  ) || /^\/donaciones\/necesidades\/[^/]+\/donar$/.test(path);
}

export function resolveCanonicalPath(pathname) {
  const path = normalizePathname(pathname);
  if (path === "/documentos") return "/repositorio";
  if (path === "/voluntariado/solicitar") return "/voluntariado";
  if (path === "/visitas/solicitar") return "/visitas";
  if (path === "/donaciones/solicitar") return "/donaciones";
  return path;
}

export function matchProductDetailPath(pathname) {
  const path = normalizePathname(pathname);
  const match = path.match(/^\/productos\/([^/]+)$/);
  if (!match) return null;
  return match[1];
}

/**
 * Metadatos base por ruta. `overrides` permite título/descripción/imagen de producto.
 */
export function resolveSeoForPath(pathname, overrides = {}) {
  const path = normalizePathname(pathname);
  const canonicalPath = resolveCanonicalPath(path);
  const productId = matchProductDetailPath(path);

  let base;
  if (isNoIndexPath(path)) {
    base = { ...DEFAULT_PRIVATE };
  } else if (productId) {
    base = {
      title: overrides.title || "Producto | Café UNA",
      description:
        overrides.description ||
        "Detalle de producto en el catálogo de Café UNA.",
      robots: "index,follow",
    };
  } else {
    base = { ...(ROUTE_SEO[canonicalPath] || DEFAULT_PUBLIC) };
  }

  const title = String(overrides.title || base.title || SITE_NAME).trim() || SITE_NAME;
  const description =
    String(overrides.description || base.description || HOME_DESCRIPTION).trim() ||
    HOME_DESCRIPTION;
  const robots = String(overrides.robots || base.robots || "index,follow").trim();
  const image = String(overrides.image || DEFAULT_OG_IMAGE).trim() || DEFAULT_OG_IMAGE;
  const canonical = absoluteUrl(overrides.canonicalPath || canonicalPath);
  const ogType = overrides.ogType || (productId ? "product" : path === "/" ? "website" : "article");

  return {
    title,
    description,
    robots,
    image,
    canonical,
    canonicalPath,
    ogType,
    locale: DEFAULT_LOCALE,
    siteName: SITE_NAME,
    productId,
  };
}

function ensureMeta(attr, key, content) {
  if (typeof document === "undefined") return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function ensureLink(rel, href, attrs = {}) {
  if (typeof document === "undefined") return;
  const hreflang = attrs.hreflang ? String(attrs.hreflang) : "";
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function ensureJsonLd(id, data) {
  if (typeof document === "undefined") return;
  const scriptId = `seo-jsonld-${id}`;
  let el = document.getElementById(scriptId);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = scriptId;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    alternateName: ["Cafe UNA", "Café UNA Costa Rica"],
    url: SITE_ORIGIN,
    logo: {
      "@type": "ImageObject",
      url: DEFAULT_OG_IMAGE,
    },
    description: HOME_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "Costa Rica",
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    alternateName: "Cafe UNA",
    url: SITE_ORIGIN,
    inLanguage: "es-CR",
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
    description: HOME_DESCRIPTION,
  };
}

export function buildWebPageJsonLd(seo) {
  if (!seo?.canonical) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${seo.canonical}#webpage`,
    url: seo.canonical,
    name: seo.title,
    description: seo.description,
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    about: { "@id": `${SITE_ORIGIN}/#organization` },
    inLanguage: "es-CR",
  };
}

export function buildProductJsonLd(product, canonicalUrl) {
  if (!product?.nombre) return null;
  const image = String(product.imagen || "").trim();
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    description: String(product.descripcion || "").trim() || undefined,
    url: canonicalUrl,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
  };
  if (image) {
    data.image = toAbsoluteAssetUrl(image);
  }
  const price = Number(product.precioConIVA ?? product.precioNormal);
  if (Number.isFinite(price) && price > 0) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: "CRC",
      price: String(price),
      availability:
        product.estado === "Deshabilitado"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: canonicalUrl,
    };
  }
  return data;
}

/** Aplica metadatos al document head (cliente). */
export function applyDocumentSeo(seo, { jsonLd } = {}) {
  if (typeof document === "undefined" || !seo) return;

  document.title = seo.title;
  ensureMeta("name", "description", seo.description);
  const robotsContent = /noindex/i.test(seo.robots)
    ? seo.robots
    : `${seo.robots}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`;
  ensureMeta("name", "robots", robotsContent);
  ensureMeta("name", "googlebot", robotsContent);
  ensureLink("canonical", seo.canonical);
  ensureLink("alternate", seo.canonical, { hreflang: "es-CR" });
  ensureLink("alternate", seo.canonical, { hreflang: "x-default" });

  ensureMeta("property", "og:type", seo.ogType || "website");
  ensureMeta("property", "og:site_name", seo.siteName || SITE_NAME);
  ensureMeta("property", "og:title", seo.title);
  ensureMeta("property", "og:description", seo.description);
  ensureMeta("property", "og:url", seo.canonical);
  ensureMeta("property", "og:image", seo.image);
  ensureMeta("property", "og:locale", seo.locale || DEFAULT_LOCALE);

  ensureMeta("name", "twitter:card", "summary_large_image");
  ensureMeta("name", "twitter:title", seo.title);
  ensureMeta("name", "twitter:description", seo.description);
  ensureMeta("name", "twitter:image", seo.image);

  if (jsonLd?.organization) ensureJsonLd("organization", jsonLd.organization);
  else if (seo.canonicalPath === "/") {
    ensureJsonLd("organization", buildOrganizationJsonLd());
    ensureJsonLd("website", buildWebSiteJsonLd());
    ensureJsonLd("webpage", buildWebPageJsonLd(seo));
  } else {
    ensureJsonLd("organization", null);
    ensureJsonLd("website", null);
    ensureJsonLd("webpage", null);
  }

  if (jsonLd?.product) ensureJsonLd("product", jsonLd.product);
  else ensureJsonLd("product", null);
}
