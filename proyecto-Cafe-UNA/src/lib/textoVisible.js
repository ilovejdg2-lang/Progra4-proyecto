/** Convierte `\u00e1` guardado como texto a la letra real, para tildes en copy del CMS. */
export function textoVisible(valor) {
  if (typeof valor !== "string") return "";
  return valor.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}
