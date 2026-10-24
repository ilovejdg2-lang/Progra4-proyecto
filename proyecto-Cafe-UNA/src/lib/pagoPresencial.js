/** Colón entero, el mismo redondeo que el subtotal de cada línea presencial. */
export function redondearColones(valor) {
  let crudo = valor;
  if (typeof crudo === "string" && crudo.includes(",") && !crudo.includes(".")) {
    crudo = crudo.replace(",", ".");
  }
  const n = Number(crudo);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export function esEfectivo(nombre) {
  return String(nombre || "").trim().toLowerCase() === "efectivo";
}

export function deduplicarMetodos(nombres) {
  const vistos = new Set();
  const salida = [];
  for (const nombre of nombres || []) {
    const limpio = String(nombre || "").trim();
    if (!limpio) continue;
    const clave = limpio.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(limpio);
  }
  return salida;
}

export function opcionesMetodoPago(nombres, etiquetas = {}) {
  return deduplicarMetodos(nombres).map((nombre) => ({
    value: nombre,
    label: etiquetas[nombre] || nombre,
  }));
}

export function calcularVuelto(total, recibido) {
  const totalRedondeado = redondearColones(total);
  const montoRecibido = redondearColones(recibido);
  const ingresado = String(recibido ?? "").trim() !== "";
  return {
    total: totalRedondeado,
    montoRecibido,
    vuelto: montoRecibido - totalRedondeado,
    suficiente: ingresado && montoRecibido >= totalRedondeado,
  };
}
