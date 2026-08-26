const SEPARADOR = "\n";

export function parsearImagenesProducto(producto) {
  const crudo = producto?.imagenes ?? producto?.imagen ?? "";
  if (Array.isArray(crudo)) {
    return crudo.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const texto = String(crudo || "").trim();
  if (!texto) return [];

  if (texto.startsWith("[")) {
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      /* URL simple que empieza raro */
    }
  }

  return texto
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializarImagenesProducto(urls) {
  const limpias = (Array.isArray(urls) ? urls : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  if (limpias.length <= 1) return limpias[0] || "";
  return limpias.join(SEPARADOR);
}

export function imagenPrincipalProducto(producto) {
  return parsearImagenesProducto(producto)[0] || "";
}
