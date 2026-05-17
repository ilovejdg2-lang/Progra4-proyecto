const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY_voluntariado;
const BIN_ID  = import.meta.env.VITE_JSONBIN_BIN_ID_voluntariado;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY,
};

// ─── Helper: leer el bin completo ───────────────────────────────────────────
async function leerBin() {
  const res = await fetch(BASE_URL, { headers });
  if (!res.ok) throw new Error(`Error al leer el bin: ${res.status}`);
  const data = await res.json();
  return data.record; // { record: [...] }
}

// ─── Helper: sobreescribir el bin completo ───────────────────────────────────
async function escribirBin(record) {
  const res = await fetch(BASE_URL, {
    method: "PUT",
    headers,
    body: JSON.stringify({ record }),
  });
  if (!res.ok) throw new Error(`Error al guardar: ${res.status}`);
  return res.json();
}

// ─── READ: obtener todas las solicitudes ────────────────────────────────────
export async function obtenerSolicitudes() {
  const data = await leerBin();
  return data.record ?? [];
}

// ─── READ: obtener solicitudes de un usuario ────────────────────────────────
export async function obtenerSolicitudesDeUsuario(userId) {
  const solicitudes = await obtenerSolicitudes();
  return solicitudes.filter((s) => s.userId === userId);
}

// ─── CREATE: agregar nueva solicitud ────────────────────────────────────────
export async function crearSolicitud(nuevaSolicitud) {
  const solicitudes = await obtenerSolicitudes();

  const solicitudCompleta = {
    id: Date.now(),
    userId: nuevaSolicitud.userId ?? "anonimo",
    fechaSolicitud: new Date().toISOString().split("T")[0],
    estado: "Pendiente",
    ...nuevaSolicitud,
  };

  const actualizadas = [...solicitudes, solicitudCompleta];
  await escribirBin(actualizadas);
  return solicitudCompleta;
}

// ─── UPDATE: actualizar campos de una solicitud ─────────────────────────────
export async function actualizarSolicitud(id, cambios) {
  const solicitudes = await obtenerSolicitudes();

  const actualizadas = solicitudes.map((s) =>
    s.id === id ? { ...s, ...cambios } : s
  );

  await escribirBin(actualizadas);
  return actualizadas.find((s) => s.id === id);
}

// ─── DELETE: eliminar una solicitud ─────────────────────────────────────────
export async function eliminarSolicitud(id) {
  const solicitudes = await obtenerSolicitudes();
  const filtradas = solicitudes.filter((s) => s.id !== id);
  await escribirBin(filtradas);
  return true;
}