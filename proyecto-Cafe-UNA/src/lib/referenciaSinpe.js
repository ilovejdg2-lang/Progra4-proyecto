/**
 * Detalle que la persona debe poner en SINPE Móvil para identificar su compra.
 * Ejemplo: cafeuna42
 */
export function referenciaSinpeCompra(compra) {
  const id = String(compra?.id ?? compra?.Id ?? "").trim();
  if (/^\d+$/.test(id)) return `cafeuna${id}`;

  const numero = String(compra?.numero ?? compra?.Numero ?? "").trim();
  const digitos = numero.replace(/\D/g, "");
  if (digitos) return `cafeuna${digitos}`;

  return "";
}
