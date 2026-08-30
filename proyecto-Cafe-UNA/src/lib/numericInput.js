/** Filtra a solo dígitos (0-9). */
export function filtrarEnteros(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

/** Filtra a dígitos y a lo sumo un punto decimal. */
export function filtrarDecimales(valor) {
  let s = String(valor ?? "").replace(/,/g, ".");
  s = s.replace(/[^\d.]/g, "");
  const i = s.indexOf(".");
  if (i === -1) return s;
  return s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "");
}

const TECLAS_CONTROL = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

export function esTeclaNumericaPermitida(key, { decimal = false, valorActual = "" } = {}) {
  if (TECLAS_CONTROL.has(key)) return true;
  if (/^\d$/.test(key)) return true;
  if (decimal && (key === "." || key === ",")) {
    return !String(valorActual).includes(".");
  }
  return false;
}
