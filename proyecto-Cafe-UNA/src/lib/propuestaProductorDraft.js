const PREFIX = "cafe-una:propuesta-productor-draft:";

export function claveBorradorPropuesta(userId) {
  const id = userId == null ? "" : String(userId).trim();
  if (!id) return "";
  return `${PREFIX}${id}`;
}

export function leerBorradorPropuesta(userId) {
  const key = claveBorradorPropuesta(userId);
  if (!key || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function guardarBorradorPropuesta(userId, payload) {
  const key = claveBorradorPropuesta(userId);
  if (!key || typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function eliminarBorradorPropuesta(userId) {
  const key = claveBorradorPropuesta(userId);
  if (!key || typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* silencio */
  }
}

export function archivoADataUrl(archivo) {
  if (!archivo) return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: archivo.name || "imagen.jpg",
        type: archivo.type || "application/octet-stream",
        size: archivo.size || 0,
        dataUrl: String(reader.result || ""),
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(archivo);
  });
}

export async function dataUrlAArchivo(meta) {
  if (!meta?.dataUrl) return null;
  try {
    const res = await fetch(meta.dataUrl);
    const blob = await res.blob();
    return new File([blob], meta.name || "imagen.jpg", {
      type: meta.type || blob.type || "application/octet-stream",
    });
  } catch {
    return null;
  }
}
