/** Pure cart quantity update; returns the next cart and a stock error message (or ""). */
export function aplicarDeltaCarrito(carrito, productoId, delta, stockMap) {
  let error = "";
  const siguiente = carrito
    .map((item) => {
      if (String(item.productoId) !== String(productoId)) return item;
      const stockDisp = Number(stockMap.get(String(productoId)) ?? item.stockDisponible ?? 0);
      const nuevaCant = item.cantidad + delta;
      if (nuevaCant > stockDisp) {
        error = `Stock máximo alcanzado para "${item.productoNombre}". Disponible: ${stockDisp} unidades.`;
        return item;
      }
      if (nuevaCant <= 0) return null;
      return {
        ...item,
        cantidad: nuevaCant,
        subtotal: Math.round(item.precioUnitario * nuevaCant),
      };
    })
    .filter(Boolean);
  return { carrito: siguiente, error };
}
