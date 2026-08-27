export const ADMIN_STOCK_PRODUCT_KEY = "cafe_una_stock_producto_id";
export const ADMIN_STOCK_PRODUCT_EVENT = "cafe-una-open-stock";

let pendingStockProduct = null;

export function requestAdminStockProduct(productId, meta = {}) {
  const id = String(productId ?? "").trim();
  if (!id) return;

  pendingStockProduct = {
    productId: id,
    nombre: String(meta.nombre ?? "").trim(),
  };

  try {
    sessionStorage.setItem(ADMIN_STOCK_PRODUCT_KEY, JSON.stringify(pendingStockProduct));
  } catch {
    try {
      sessionStorage.setItem(ADMIN_STOCK_PRODUCT_KEY, id);
    } catch {
      /* ignore */
    }
  }

  window.dispatchEvent(new CustomEvent(ADMIN_STOCK_PRODUCT_EVENT, { detail: pendingStockProduct }));
}

export function peekPendingStockProduct() {
  if (pendingStockProduct?.productId) {
    return pendingStockProduct;
  }

  const fromUrl = new URLSearchParams(window.location.search).get("stockProductoId");
  if (fromUrl) {
    return { productId: String(fromUrl), nombre: "" };
  }

  try {
    const raw = sessionStorage.getItem(ADMIN_STOCK_PRODUCT_KEY);
    if (!raw) return null;
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      if (parsed?.productId) return parsed;
    }
    return { productId: String(raw), nombre: "" };
  } catch {
    return null;
  }
}

export function clearPendingStockProduct() {
  pendingStockProduct = null;
  try {
    sessionStorage.removeItem(ADMIN_STOCK_PRODUCT_KEY);
  } catch {
    /* ignore */
  }
}
