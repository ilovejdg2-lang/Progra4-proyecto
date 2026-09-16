export const TIPOS_COMPROBANTE = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024;

export async function confirmarCompraEnBackend({ registrarCompraFn, payload, archivo }) {
  return registrarCompraFn(payload, archivo);
}

export function validarComprobante(file) {
  if (!file) return 'Adjuntá el comprobante de pago.';
  if (!TIPOS_COMPROBANTE.has(file.type)) {
    return 'El comprobante debe ser una imagen JPG, PNG o WEBP.';
  }
  if (file.size > MAX_COMPROBANTE_BYTES) {
    return 'El comprobante debe pesar máximo 10 MB.';
  }
  return null;
}
