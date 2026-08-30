export function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor || 0);
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
