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

export function esImagenSubidaProducto(url) {
  const texto = String(url || "").trim();
  if (!texto) return false;
  return /\/api\/productos\/imagenes\//i.test(texto);
}

export const TIPOS_IMAGEN_PRODUCTO = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_IMAGEN_PRODUCTO_BYTES = 10 * 1024 * 1024;

export function validarArchivoImagenProducto(file) {
  if (!file) return "Seleccioná una imagen.";
  if (!TIPOS_IMAGEN_PRODUCTO.has(file.type)) {
    return "La imagen debe ser JPG, PNG o WEBP.";
  }
  if (file.size > MAX_IMAGEN_PRODUCTO_BYTES) {
    return "La imagen debe pesar máximo 10 MB.";
  }
  return null;
}
