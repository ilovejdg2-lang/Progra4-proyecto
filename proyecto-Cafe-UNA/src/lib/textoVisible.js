/** Convierte `\u00e1` guardado como texto a la letra real, para tildes en copy del CMS. */
export function textoVisible(valor) {
  if (typeof valor !== "string") return "";
  return valor.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

/**
 * Repara mojibake típico (UTF-8 leído como Latin-1): "PÃ©rez" → "Pérez".
 */
export function repararUtf8Mojibake(valor) {
  if (typeof valor !== "string" || !valor) return typeof valor === "string" ? valor : "";
  if (!/[ÃÂ]/.test(valor)) return valor;
  try {
    const bytes = Uint8Array.from(
      Array.from(valor, (ch) => ch.charCodeAt(0) & 0xff),
    );
    const fijo = new TextDecoder("utf-8").decode(bytes);
    if (!fijo || fijo.includes("\uFFFD")) return valor;
    return fijo;
  } catch {
    return valor;
  }
}

/** Texto de UI con escapes unicode y mojibake corregidos. */
export function textoUi(valor) {
  return repararUtf8Mojibake(textoVisible(valor));
}

