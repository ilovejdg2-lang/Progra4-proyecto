export function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

export function etiquetaEstadoProducto(producto) {
  if (producto?.estado === "Deshabilitado") {
    return { texto: "Deshabilitado", clase: "text-red-600" };
  }

  if ((Number(producto?.stock) || 0) <= 0) {
    return { texto: "Agotado", clase: "text-amber-800" };
  }

  return { texto: "Habilitado", clase: "text-green-700" };
}

export function destacadoDeshabilitado(producto, destacadosEnUso, maxDestacados, puedeDestacarse) {
  return !producto.esDestacado && (destacadosEnUso >= maxDestacados || !puedeDestacarse(producto));
}
