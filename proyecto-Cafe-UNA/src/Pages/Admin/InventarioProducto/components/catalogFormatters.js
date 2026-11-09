const FORMATO_PRECIO = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor) {
  return FORMATO_PRECIO.format(valor || 0);
}

/** Etiqueta visible de estado: Activo | Inactivo | Agotado */
export function etiquetaEstadoProducto(producto) {
  if (producto?.estado === "Deshabilitado") {
    return { texto: "Inactivo", clase: "text-red-600", clave: "inactivo" };
  }

  const stock =
    producto?.centralStock?.confidence === "known"
      ? Number(producto.centralStock.stock)
      : Number(producto?.stock);

  if (Number.isFinite(stock) && stock <= 0) {
    return { texto: "Agotado", clase: "text-amber-800", clave: "agotado" };
  }

  return { texto: "Activo", clase: "text-green-700", clave: "activo" };
}

export function destacadoDeshabilitado(producto, destacadosEnUso, maxDestacados, puedeDestacarse) {
  return !producto.esDestacado && (destacadosEnUso >= maxDestacados || !puedeDestacarse(producto));
}

/** Why the featured star cannot be turned on (null when it can, or when it is already on). */
export function motivoDestacadoBloqueado(producto, destacadosEnUso, maxDestacados, puedeDestacarse) {
  if (producto.esDestacado) return null;
  if (destacadosEnUso >= maxDestacados) return `Máximo ${maxDestacados} destacados`;
  if (puedeDestacarse(producto)) return null;
  return producto.estado === "Deshabilitado"
    ? "No puedes destacar un producto deshabilitado"
    : "No puedes destacar un producto sin stock";
}

/** Row status: Activo | Inactivo. Stock (including Agotado) is conveyed by the stock column. */
export function estadoFilaProducto(producto) {
  return producto?.estado === "Deshabilitado"
    ? { texto: "Inactivo", tono: "neutral" }
    : { texto: "Activo", tono: "success" };
}
