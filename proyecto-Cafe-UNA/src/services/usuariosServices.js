const BIN_ID  = import.meta.env.VITE_JSONBIN_USERS_BIN_ID_USUARIOS;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const headers = {
  "Content-Type": "application/json",
  "X-Access-Key": import.meta.env.VITE_JSONBIN_ACCESS_KEY_CRUD_USUARIOS,
};

// ─── Helper: leer el bin completo ────────────────────────────────────────────
async function leerBin() {
  const res = await fetch(BASE_URL, { headers });
  if (!res.ok) throw new Error(`Error al leer usuarios: ${res.status}`);
  const data = await res.json();
  // JSONBin devuelve { record: [...] }
  return data.record ?? [];
}

// ─── Helper: sobreescribir el bin completo ───────────────────────────────────
async function escribirBin(usuarios) {
  const res = await fetch(BASE_URL, {
    method: "PUT",
    headers,
    body: JSON.stringify(usuarios),
  });
  if (!res.ok) throw new Error(`Error al guardar usuarios: ${res.status}`);
  return res.json();
}

// ─── Helper: generar el próximo id único ────────────────────────────────────
function siguienteId(usuarios) {
  if (usuarios.length === 0) return 1;
  return Math.max(...usuarios.map((u) => u.id ?? 0)) + 1;
}

// ─── READ: obtener todos los usuarios ────────────────────────────────────────
export async function obtenerUsuarios() {
  return leerBin();
}

// ─── READ: obtener sólo usuarios activos ────────────────────────────────────
export async function obtenerUsuariosActivos() {
  const usuarios = await leerBin();
  return usuarios.filter((u) => u.estado === "activo");
}

// ─── READ: obtener un usuario por id ────────────────────────────────────────
export async function obtenerUsuarioPorId(id) {
  const usuarios = await leerBin();
  return usuarios.find((u) => u.id === id) ?? null;
}

// ─── CREATE: agregar nuevo usuario ───────────────────────────────────────────
export async function crearUsuario(nuevoUsuario) {
  const usuarios = await leerBin();

  const usuarioCompleto = {
    ...nuevoUsuario,
    id: siguienteId(usuarios), // id autoincremental sin repetición
    estado: "activo",          // siempre activo al crear
    roles: nuevoUsuario.roles ?? ["Usuario"],
  };

  await escribirBin([...usuarios, usuarioCompleto]);
  return usuarioCompleto;
}

// ─── UPDATE: actualizar campos de un usuario ────────────────────────────────
export async function actualizarUsuario(id, cambios) {
  const usuarios = await leerBin();

  const actualizados = usuarios.map((u) =>
    u.id === id ? { ...u, ...cambios, id } : u   // id nunca se sobreescribe
  );

  await escribirBin(actualizados);
  return actualizados.find((u) => u.id === id) ?? null;
}

// ─── TOGGLE ESTADO: activar o inactivar un usuario ──────────────────────────
/**
 * Alterna el estado del usuario entre "activo" e "inactivo".
 * Si se pasa el parámetro `forzar`, establece ese estado directamente.
 *
 * @param {number} id
 * @param {"activo"|"inactivo"|null} forzar  - opcional
 * @returns {Promise<object>} usuario actualizado
 */
export async function toggleEstadoUsuario(id, forzar = null) {
  const usuarios = await leerBin();

  const actualizados = usuarios.map((u) => {
    if (u.id !== id) return u;
    const nuevoEstado = forzar ?? (u.estado === "activo" ? "inactivo" : "activo");
    return { ...u, estado: nuevoEstado };
  });

  await escribirBin(actualizados);
  return actualizados.find((u) => u.id === id) ?? null;
}

// ─── Atajos explícitos ───────────────────────────────────────────────────────
export const activarUsuario   = (id) => toggleEstadoUsuario(id, "activo");
export const inactivarUsuario = (id) => toggleEstadoUsuario(id, "inactivo");