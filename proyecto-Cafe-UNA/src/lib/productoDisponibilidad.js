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
