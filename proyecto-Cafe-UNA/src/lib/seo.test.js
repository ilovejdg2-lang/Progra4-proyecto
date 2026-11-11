import { afterEach, describe, expect, it } from "vitest";
import {
  absoluteUrl,
  applyDocumentSeo,
  buildProductJsonLd,
  isNoIndexPath,
  matchProductDetailPath,
  normalizePathname,
  PUBLIC_INDEXABLE_PATHS,
  resolveCanonicalPath,
  resolveSeoForPath,
  SITE_ORIGIN,
} from "./seo";

describe("seo helpers", () => {
  afterEach(() => {
    document.title = "";
    document.head.querySelectorAll("meta[name], meta[property], link[rel='canonical'], script[id^='seo-jsonld-']").forEach((el) => el.remove());
  });

  it("normalizes trailing slashes", () => {
    expect(normalizePathname("/productos/")).toBe("/productos");
    expect(normalizePathname("/")).toBe("/");
  });

  it("builds absolute canonical URLs on cafeuna.app", () => {
    expect(absoluteUrl("/")).toBe(`${SITE_ORIGIN}/`);
    expect(absoluteUrl("/productos")).toBe(`${SITE_ORIGIN}/productos`);
  });

  it("marks private routes as noindex", () => {
    expect(isNoIndexPath("/admin")).toBe(true);
    expect(isNoIndexPath("/admin/producto")).toBe(true);
    expect(isNoIndexPath("/login")).toBe(true);
    expect(isNoIndexPath("/checkout")).toBe(true);
    expect(isNoIndexPath("/perfil/compras")).toBe(true);
    expect(isNoIndexPath("/productos")).toBe(false);
    expect(isNoIndexPath("/")).toBe(false);
  });

  it("canonicalizes aliases", () => {
    expect(resolveCanonicalPath("/documentos")).toBe("/repositorio");
    expect(resolveCanonicalPath("/voluntariado/solicitar")).toBe("/voluntariado");
  });

  it("resolves home metadata from the approved copy", () => {
    const seo = resolveSeoForPath("/");
    expect(seo.title).toContain("Café UNA");
    expect(seo.description).toMatch(/productores/);
    expect(seo.robots).toBe("index,follow");
    expect(seo.canonical).toBe(`${SITE_ORIGIN}/`);
  });

  it("uses noindex for auth and checkout", () => {
    expect(resolveSeoForPath("/login").robots).toBe("noindex,nofollow");
    expect(resolveSeoForPath("/checkout").robots).toBe("noindex,nofollow");
  });

  it("detects product detail slugs", () => {
    expect(matchProductDetailPath("/productos/42")).toBe("42");
    expect(matchProductDetailPath("/productos/cafe-molido-tueste-medio")).toBe(
      "cafe-molido-tueste-medio",
    );
    expect(matchProductDetailPath("/productos")).toBeNull();
  });

  it("lists only public static paths for the sitemap seed", () => {
    expect(PUBLIC_INDEXABLE_PATHS).toContain("/");
    expect(PUBLIC_INDEXABLE_PATHS).toContain("/productos");
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain("/login");
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain("/checkout");
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain("/admin");
  });

  it("builds product JSON-LD without inventing prices when missing", () => {
    const json = buildProductJsonLd(
      { nombre: "Café en grano", descripcion: "Tueste", precioConIVA: 2500 },
      `${SITE_ORIGIN}/productos/1`,
    );
    expect(json["@type"]).toBe("Product");
    expect(json.offers.priceCurrency).toBe("CRC");
    expect(json.offers.price).toBe("2500");
  });

  it("writes title, description, canonical and robots into the document", () => {
    applyDocumentSeo(resolveSeoForPath("/productos"));
    expect(document.title).toBe("Productos | Café UNA");
    expect(document.head.querySelector('meta[name="description"]')?.content).toMatch(/catálogo/i);
    expect(document.head.querySelector('link[rel="canonical"]')?.href).toBe(
      `${SITE_ORIGIN}/productos`,
    );
    expect(document.head.querySelector('meta[name="robots"]')?.content).toContain("index,follow");
    expect(document.head.querySelector('meta[name="robots"]')?.content).toContain(
      "max-image-preview:large",
    );
    expect(document.head.querySelector('meta[property="og:url"]')?.content).toBe(
      `${SITE_ORIGIN}/productos`,
    );
  });

  it("keeps noindex without rich-result hints", () => {
    applyDocumentSeo(resolveSeoForPath("/login"));
    expect(document.head.querySelector('meta[name="robots"]')?.content).toBe("noindex,nofollow");
  });
});
