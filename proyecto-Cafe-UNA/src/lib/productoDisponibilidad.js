export function productoEstaDeshabilitado(producto) {
  return producto?.estado === 'Deshabilitado';
}

export function productoSinStock(producto) {
  return (Number(producto?.stock) || 0) <= 0;
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
