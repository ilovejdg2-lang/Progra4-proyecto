export function productoEstaDeshabilitado(producto) {
  return producto?.estado === "Deshabilitado";
}

export function stockCentralConocido(producto) {
  return producto?.centralStock?.confidence === "known"
    && Number.isInteger(producto.centralStock.stock)
    && producto.centralStock.stock >= 0;
}

export function obtenerStockCentral(producto) {
  if (producto?.centralStock) {
    return stockCentralConocido(producto) ? producto.centralStock.stock : null;
  }

  return Number.isFinite(Number(producto?.stock)) ? Number(producto.stock) : null;
}

export function productoSinStock(producto) {
  const stock = obtenerStockCentral(producto);
  return stock === null || stock <= 0;
}

export function productoNoDisponible(producto) {
  return productoEstaDeshabilitado(producto) || productoSinStock(producto);
}

export function productoPuedeDestacarse(producto) {
  return !productoNoDisponible(producto);
}

export function productoPuedeDeshabilitarse(producto) {
  return !producto?.esDestacado;
}

/** Umbral: 1..POCAS_UNIDADES_MAX = "Pocas unidades". */
export const POCAS_UNIDADES_MAX = 5;

/**
 * @returns {{ codigo: 'agotado'|'pocas'|'disponible', etiqueta: string, stock: number }}
 */
export function clasificarDisponibilidad(productoOrStock, estado) {
  const stock =
    typeof productoOrStock === "number"
      ? productoOrStock
      : Number(
          productoOrStock?.stockTotal ??
            productoOrStock?.stock ??
            obtenerStockCentral(productoOrStock),
        ) || 0;
  const estadoProducto =
    typeof productoOrStock === "number"
      ? estado
      : productoOrStock?.estado;
  const disponibleFlag =
    typeof productoOrStock === "object" && productoOrStock
      ? productoOrStock.disponible
      : undefined;
  const stockMinimo =
    typeof productoOrStock === "object" && productoOrStock
      ? Number(productoOrStock.stockMinimo) || 0
      : 0;

  if (
    estadoProducto === "Deshabilitado" ||
    disponibleFlag === false ||
    stock <= 0
  ) {
    return { codigo: "agotado", etiqueta: "Agotado", stock };
  }
  const umbralPocas = stockMinimo > 0 ? stockMinimo : POCAS_UNIDADES_MAX;
  if (stock <= umbralPocas) {
    return { codigo: "pocas", etiqueta: "Pocas unidades", stock };
  }
  return { codigo: "disponible", etiqueta: "Disponible", stock };
}

export function indicadorStockCantidad(stock, loading = false) {
  if (loading) return { codigo: "cargando", etiqueta: "Cargando...", clase: "text-slate-400", punto: "bg-slate-300" };
  if (stock === null || stock === undefined) {
    return { codigo: "sin-registro", etiqueta: "Sin registro", clase: "text-slate-500", punto: "bg-slate-300" };
  }
  const n = Number(stock);
  if (!Number.isFinite(n) || n <= 0) {
    return { codigo: "agotado", etiqueta: String(n || 0), clase: "text-rose-700", punto: "bg-rose-600" };
  }
  if (n <= POCAS_UNIDADES_MAX) {
    return { codigo: "pocas", etiqueta: String(n), clase: "text-amber-700", punto: "bg-amber-500" };
  }
  return { codigo: "disponible", etiqueta: String(n), clase: "text-emerald-700", punto: "bg-emerald-600" };
}
