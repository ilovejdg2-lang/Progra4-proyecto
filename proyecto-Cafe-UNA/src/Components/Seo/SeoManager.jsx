import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  applyDocumentSeo,
  buildProductJsonLd,
  matchProductDetailPath,
  resolveSeoForPath,
  toAbsoluteAssetUrl,
} from "../../lib/seo";
import { imagenPrincipalProducto } from "../../lib/productoImagenes";
import { obtenerProductoPorSlug } from "../../services/productosService";
import { normalizeImageUrl } from "../../lib/imageUtils";

/**
 * Actualiza title/meta/canonical/OG/JSON-LD según la ruta activa.
 * En detalle de producto carga datos públicos del catálogo (best-effort).
 */
export function SeoManager() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    let cancelled = false;
    const productSlug = matchProductDetailPath(pathname);

    const applyBase = () => {
      if (cancelled) return;
      applyDocumentSeo(resolveSeoForPath(pathname));
    };

    applyBase();

    if (!productSlug) return () => {
      cancelled = true;
    };

    void (async () => {
      try {
        const product = await obtenerProductoPorSlug(productSlug);
        if (cancelled || !product || product.estado === "Deshabilitado") return;

        const nombre = String(product.nombre || "").trim() || "Producto";
        const descripcionRaw = String(product.descripcion || "").trim();
        const description =
          descripcionRaw.length > 0
            ? descripcionRaw.slice(0, 160)
            : `${nombre} en el catálogo de Café UNA.`;
        const imagen = imagenPrincipalProducto(product) || product.imagen || "";
        const imageAbs = imagen
          ? toAbsoluteAssetUrl(normalizeImageUrl(imagen, { width: 1200 }) || imagen)
          : undefined;

        const seo = resolveSeoForPath(pathname, {
          title: `${nombre} | Café UNA`,
          description,
          image: imageAbs,
        });

        if (cancelled) return;
        applyDocumentSeo(seo, {
          jsonLd: {
            product: buildProductJsonLd(
              { ...product, imagen: imageAbs || imagen },
              seo.canonical,
            ),
          },
        });
      } catch {
        /* Mantener metadatos base del producto. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}

export default SeoManager;
