const READ_KEY = import.meta.env.VITE_JSONBIN_API_KEY_LECTURA_INFORMACION;
const CRUD_KEY = import.meta.env.VITE_JSONBIN_API_KEY_CRUD_INFORMACION;
const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID_INFORMACION;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const LATEST_URL = `${BASE_URL}/latest`;

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function crearErrorJsonBin(res, accion) {
  let detalle;

  try {
    const data = await res.json();
    detalle = data.message || data.error || JSON.stringify(data);
  } catch {
    detalle = await res.text();
  }

  return new Error(`Error al ${accion} informacion: ${res.status}${detalle ? ` - ${detalle}` : ""}`);
}

async function leerBin() {
  const res = await fetch(`${LATEST_URL}?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      ...jsonHeaders,
      "X-Access-Key": READ_KEY || CRUD_KEY,
    },
  });

  if (!res.ok) throw await crearErrorJsonBin(res, "leer");

  const data = await res.json();
  const record = data.record ?? {};
  return record.record ?? record;
}

async function escribirBin(record) {
  const res = await fetch(BASE_URL, {
    method: "PUT",
    cache: "no-store",
    headers: {
      ...jsonHeaders,
      "X-Access-Key": CRUD_KEY,
    },
    body: JSON.stringify(record),
  });

  if (!res.ok) throw await crearErrorJsonBin(res, "guardar");

  return res.json();
}

export async function obtenerInformacion() {
  return await leerBin();
}

export async function obtenerSeccion(seccion) {
  const info = await obtenerInformacion();
  return info[seccion] ?? null;
}

export async function actualizarInformacion(nuevaInformacion) {
  await escribirBin(nuevaInformacion);
  return nuevaInformacion;
}

export async function actualizarSeccion(seccion, cambios) {
  const info = await obtenerInformacion();
  const actualizado = { ...info, [seccion]: { ...(info[seccion] ?? {}), ...cambios } };
  await escribirBin(actualizado);
  return actualizado[seccion];
}

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

export async function obtenerHero() {
  return await obtenerSeccion("hero");
}
