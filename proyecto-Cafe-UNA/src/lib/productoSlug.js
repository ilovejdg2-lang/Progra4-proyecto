/** Convierte el nombre del producto en un segmento de URL legible. */
export function slugifyProductoNombre(nombre) {
  const base = String(nombre ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return base || "producto";
}

/**
 * Slug estable para enlaces. Si hay varios con el mismo nombre en el catálogo,
 * añade el id solo para desambiguar.
 */
export function slugDeProducto(producto, catalogo = []) {
  const base = slugifyProductoNombre(producto?.nombre);
  const id = String(producto?.id ?? "").trim();
  const lista = Array.isArray(catalogo) ? catalogo : [];
  const mismos = lista.filter(
    (item) => slugifyProductoNombre(item?.nombre) === base,
  );
  if (mismos.length <= 1 || !id) return base;
  return `${base}-${id}`;
}

/** Resuelve un producto del catálogo por slug (o por id numérico legado). */
export function encontrarProductoPorSlug(catalogo, slugRaw) {
  const slug = decodeURIComponent(String(slugRaw ?? "").trim()).toLowerCase();
  if (!slug) return null;
  const lista = Array.isArray(catalogo) ? catalogo : [];

  if (/^\d+$/.test(slug)) {
    return lista.find((item) => String(item.id) === slug) ?? null;
  }

  const porSlugExacto = lista.filter(
    (item) => slugDeProducto(item, lista) === slug,
  );
  if (porSlugExacto.length === 1) return porSlugExacto[0];
  if (porSlugExacto.length > 1) {
    return (
      porSlugExacto.find((item) => item.estado !== "Deshabilitado") ||
      porSlugExacto[0]
    );
  }

  const porNombre = lista.filter(
    (item) => slugifyProductoNombre(item?.nombre) === slug,
  );
  if (porNombre.length === 1) return porNombre[0];
  if (porNombre.length > 1) {
    return (
      porNombre.find((item) => item.estado !== "Deshabilitado") || porNombre[0]
    );
  }

  return null;
}
