/**
 * Detalle que la persona debe poner en SINPE Móvil para identificar su compra.
 * Solo usa el Id de la compra (no el Numero con timestamp).
 * Ejemplo: caféUNA42
 */
export function referenciaSinpeCompra(compra) {
  const id = String(compra?.id ?? compra?.Id ?? "").trim();
  if (!/^\d+$/.test(id) || Number(id) <= 0) return "";
  return `caféUNA${id}`;
}
