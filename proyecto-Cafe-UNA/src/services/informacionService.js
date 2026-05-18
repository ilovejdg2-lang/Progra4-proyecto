// Servicio para la información estática del sitio (hero, misión, visión, galería)
// Usa la clave CRUD definida en .env para lectura y escritura:
// - VITE_JSONBIN_API_KEY_CRUD_INFORMACION
// - VITE_JSONBIN_BIN_ID_INFORMACION

const CRUD_KEY = import.meta.env.VITE_JSONBIN_API_KEY_CRUD_INFORMACION;
const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID_INFORMACION;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const headers = {
  'Content-Type': 'application/json',
  'X-Access-Key': CRUD_KEY,
};

// Helper: leer el bin (usa la key de lectura)
async function leerBin() {
  const res = await fetch(BASE_URL, { headers });
  if (!res.ok) throw new Error(`Error al leer el bin de información: ${res.status}`);
  const data = await res.json();
  return data.record ?? {};
}

// Helper: sobreescribir el bin (usa la key CRUD)
async function escribirBin(record) {
  const res = await fetch(BASE_URL, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ record }),
  });
  if (!res.ok) throw new Error(`Error al guardar información: ${res.status}`);
  return res.json();
}

// READ: obtener toda la información
export async function obtenerInformacion() {
  return await leerBin();
}

// READ: obtener una sección concreta (hero, mission, vision, gallery...)
export async function obtenerSeccion(seccion) {
  const info = await obtenerInformacion();
  return info[seccion] ?? null;
}

// UPDATE (overwrite): reemplaza toda la info
export async function actualizarInformacion(nuevaInformacion) {
  await escribirBin(nuevaInformacion);
  return nuevaInformacion;
}

// UPDATE: actualizar una sección parcial
export async function actualizarSeccion(seccion, cambios) {
  const info = await obtenerInformacion();
  const actualizado = { ...info, [seccion]: { ...(info[seccion] ?? {}), ...cambios } };
  await escribirBin(actualizado);
  return actualizado[seccion];
}

// GALERÍA CRUD
export async function agregarGaleriaItem(item) {
  const info = await obtenerInformacion();
  const gallery = Array.isArray(info.gallery) ? info.gallery : [];
  const nuevo = { id: Date.now(), ...item };
  const actualizado = { ...info, gallery: [...gallery, nuevo] };
  await escribirBin(actualizado);
  return nuevo;
}

export async function actualizarGaleriaItem(id, cambios) {
  const info = await obtenerInformacion();
  const gallery = Array.isArray(info.gallery) ? info.gallery : [];
  const actualizados = gallery.map((g) => (g.id === id ? { ...g, ...cambios } : g));
  const nuevoInfo = { ...info, gallery: actualizados };
  await escribirBin(nuevoInfo);
  return actualizados.find((g) => g.id === id) ?? null;
}

export async function eliminarGaleriaItem(id) {
  const info = await obtenerInformacion();
  const gallery = Array.isArray(info.gallery) ? info.gallery : [];
  const filtrada = gallery.filter((g) => g.id !== id);
  const nuevoInfo = { ...info, gallery: filtrada };
  await escribirBin(nuevoInfo);
  return true;
}

// Helper adicional: obtener el hero
export async function obtenerHero() {
  return await obtenerSeccion('hero');
}
