/**
 * Genera public/sitemap.xml en build.
 * - Siempre incluye rutas públicas estáticas.
 * - Intenta añadir productos habilitados desde el backend (no falla el build si cae).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeBackendUrl } from "./normalizeBackendUrl.mjs";

const SITE_ORIGIN = "https://cafeuna.app";

const STATIC_PATHS = [
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
];

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(rootDir, "public");
const outPath = join(publicDir, "sitemap.xml");

function backendUrlFromEnv() {
  try {
    const content = readFileSync(join(rootDir, ".env"), "utf8");
    const match = content.match(/^BACKEND_URL=(.+)$/m);
    return match?.[1]?.trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

function toLoc(path) {
  if (path === "/") return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlEntry(loc) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;
}

async function fetchProductPaths(apiBase) {
  if (!apiBase) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/productos`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[sitemap] backend respondió ${res.status}; solo rutas estáticas.`);
      return [];
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];
    const paths = [];
    for (const item of list) {
      const id = item?.id ?? item?.Id ?? item?.ID;
      const estado = item?.estado ?? item?.Estado;
      if (id == null || String(id).trim() === "") continue;
      if (String(estado || "") === "Deshabilitado") continue;
      paths.push(`/productos/${encodeURIComponent(String(id))}`);
    }
    console.log(`[sitemap] productos públicos: ${paths.length}`);
    return paths;
  } catch (err) {
    console.warn(`[sitemap] no se pudo consultar productos (${err?.message || err}); solo estáticas.`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

const backendUrl = normalizeBackendUrl(process.env.BACKEND_URL || backendUrlFromEnv());
const productPaths = await fetchProductPaths(backendUrl);

const seen = new Set();
const locs = [];
for (const path of [...STATIC_PATHS, ...productPaths]) {
  const loc = toLoc(path);
  if (seen.has(loc)) continue;
  seen.add(loc);
  locs.push(loc);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locs.map(urlEntry).join("\n")}
</urlset>
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(outPath, xml, "utf8");
console.log(`public/sitemap.xml -> ${locs.length} URLs (${SITE_ORIGIN})`);
