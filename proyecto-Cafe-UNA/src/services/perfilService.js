import { apiRequest } from "./apiClient";
import { getActiveSessionUser, getStoredUser, isLoggingOut, isSessionExpired } from "./sessionService";
import { obtenerUsuarioPorId } from "./usuariosService";

const BASE_URL = `${import.meta.env.BACKEND_URL}/perfil`;
const IMAGE_ENDPOINT = `${BASE_URL}/imagenes`;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_NAME = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
const CACHE_TTL_MS = 5 * 60 * 1000;
let perfilCache = { expiresAt: 0, data: null };
let perfilInflight = null;

function clearPerfilCache() {
  perfilCache = { expiresAt: 0, data: null };
  perfilInflight = null;
}

export { clearPerfilCache };

function normalizePerfil(data) {
  if (!data) return null;
  return {
    id: data.id ?? data.Id,
    nombre: data.nombre ?? data.Nombre ?? "",
    correo: data.correo ?? data.Correo ?? "",
    estado: data.estado ?? data.Estado ?? "",
    roles: Array.isArray(data.roles) ? data.roles : (Array.isArray(data.Roles) ? data.Roles : []),
    fotoPerfilUrl: data.fotoPerfilUrl ?? data.FotoPerfilUrl ?? "",
    fotoBannerUrl: data.fotoBannerUrl ?? data.FotoBannerUrl ?? "",
    fotoPerfilPosicion: data.fotoPerfilPosicion ?? data.FotoPerfilPosicion ?? "",
    fotoBannerPosicion: data.fotoBannerPosicion ?? data.FotoBannerPosicion ?? "",
    tipoCliente: data.tipoCliente ?? data.TipoCliente ?? null,
    telefono: data.telefono ?? data.Telefono ?? null,
    apellidos: data.apellidos ?? data.Apellidos ?? null,
    identificacion: data.identificacion ?? data.Identificacion ?? null,
    nombreLegal: data.nombreLegal ?? data.NombreLegal ?? null,
    tipoDocumento: data.tipoDocumento ?? data.TipoDocumento ?? null,
    nacionalidad: data.nacionalidad ?? data.Nacionalidad ?? null,
    razonSocial: data.razonSocial ?? data.RazonSocial ?? null,
    nombreComercial: data.nombreComercial ?? data.NombreComercial ?? null,
    representanteLegal: data.representanteLegal ?? data.RepresentanteLegal ?? null,
    cedulaJuridica: data.cedulaJuridica ?? data.CedulaJuridica ?? null,
    direccionFiscal: data.direccionFiscal ?? data.DireccionFiscal ?? null,
    telefonoOficina: data.telefonoOficina ?? data.TelefonoOficina ?? null,
  };
}

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    errorPrefix: "Error en perfil",
    timeoutMessage: "Tiempo de espera agotado al consultar el perfil.",
  });
}

export async function obtenerPerfil() {
  const storedUser = getStoredUser();
  if (!storedUser || isSessionExpired(storedUser)) {
    clearPerfilCache();
    return null;
  }

  if (perfilCache.expiresAt > Date.now() && perfilCache.data) {
    return perfilCache.data;
  }

  if (perfilInflight) {
    return perfilInflight;
  }

  perfilInflight = (async () => {
    try {
      const data = await request(BASE_URL);
      let normalized = normalizePerfil(data);
      const esCliente = (normalized?.roles || []).some(
        (rol) => String(rol).toLowerCase() === "cliente",
      );
      if (esCliente && !normalized?.tipoCliente) {
        try {
          const sessionUser = getActiveSessionUser();
          if (sessionUser?.id) {
            const completo = await obtenerUsuarioPorId(sessionUser.id);
            normalized = {
              ...normalized,
              ...normalizePerfil(completo),
              roles: normalized.roles,
            };
          }
        } catch {
          /* keep perfil base */
        }
      }
      perfilCache = { expiresAt: Date.now() + CACHE_TTL_MS, data: normalized };
      return normalized;
    } catch (error) {
      const sessionUser = getActiveSessionUser();
      if (!sessionUser?.id) {
        throw error;
      }

      try {
        const fallback = await obtenerUsuarioPorId(sessionUser.id);
        const normalized = normalizePerfil(fallback);
        perfilCache = { expiresAt: Date.now() + CACHE_TTL_MS, data: normalized };
        return normalized;
      } catch {
        throw error;
      }
    } finally {
      perfilInflight = null;
    }
  })();

  return perfilInflight;
}

export async function actualizarPerfil(payload) {
  clearPerfilCache();
  const data = await request(BASE_URL, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizePerfil(data);
}

export async function actualizarPerfilCliente(payload) {
  clearPerfilCache();
  const data = await request(`${BASE_URL}/cliente`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return normalizePerfil(data);
}

export async function solicitarCambioCorreo(nuevoCorreo, passwordActual) {
  return request(`${BASE_URL}/solicitar-cambio-correo`, {
    method: "POST",
    body: JSON.stringify({ nuevoCorreo, passwordActual }),
  });
}

export async function confirmarCambioCorreo({ nuevoCorreo, token }) {
  clearPerfilCache();
  const data = await request(`${BASE_URL}/confirmar-cambio-correo`, {
    method: "PUT",
    body: JSON.stringify({ nuevoCorreo, token }),
  });
  return normalizePerfil(data);
}

export async function cambiarPasswordPerfil({ passwordActual, passwordNueva }) {
  return request(`${BASE_URL}/password`, {
    method: "PUT",
    body: JSON.stringify({ passwordActual, passwordNueva }),
  });
}

export function classifyProfileImageSource(source) {
  const raw = typeof source === "string" ? source.trim() : "";
  if (!raw) return { kind: "empty", url: "" };
  let parsed;
  let decodedPath;
  try {
    parsed = new URL(raw, window.location.origin);
    decodedPath = decodeURIComponent(parsed.pathname);
  } catch {
    return { kind: "blocked" };
  }
  if (!decodedPath.toLowerCase().includes("/perfil/imagenes")) return { kind: "external", url: raw };
  const trusted = new URL(IMAGE_ENDPOINT, window.location.origin);
  const unsafeSyntax = /[%\\?#]/.test(raw) || raw.split("/").some((part) => part === "." || part === "..");
  if (unsafeSyntax || parsed.username || parsed.password || ![trusted.origin, window.location.origin].includes(parsed.origin)) {
    return { kind: "blocked" };
  }
  const prefixes = ["/api/perfil/imagenes/", `${trusted.pathname}/`];
  const prefix = prefixes.find((candidate) => parsed.pathname.startsWith(candidate));
  const name = prefix ? parsed.pathname.slice(prefix.length) : "";
  if (!IMAGE_NAME.test(name)) return { kind: "blocked" };
  return { kind: "private", path: `/api/perfil/imagenes/${name}`, requestUrl: `${IMAGE_ENDPOINT}/${name}` };
}

function requireImageSession() {
  const user = getStoredUser();
  if (!user?.id || !user.token || isLoggingOut() || isSessionExpired(user)) {
    throw new Error("Inicie sesión para acceder a imágenes de perfil.");
  }
  return user;
}

export async function subirImagenPerfil(file, signal) {
  const user = requireImageSession();
  const supported = /\.(jpe?g|png|webp)$/i.test(file?.name || "") || ["image/jpeg", "image/png", "image/webp"].includes(file?.type);
  if (!file || file.size > MAX_IMAGE_BYTES || !supported) {
    throw new Error("Adjunte una imagen JPG, PNG o WEBP de hasta 10 MB.");
  }
  const data = new FormData();
  data.append("imagen", file);
  const response = await request(IMAGE_ENDPOINT, { method: "POST", data, signal });
  const result = classifyProfileImageSource(response?.url ?? response?.Url);
  if (result.kind !== "private" || String(requireImageSession().id) !== String(user.id)) {
    throw new Error("No se pudo confirmar la imagen de perfil.");
  }
  return result.path;
}

export async function obtenerImagenPerfil(source, signal) {
  requireImageSession();
  const image = classifyProfileImageSource(source);
  if (image.kind !== "private") throw new Error("La ruta de imagen de perfil no es válida.");
  const blob = await request(image.requestUrl, { responseType: "blob", signal });
  if (!(blob instanceof Blob) || blob.type !== "image/webp" || !blob.size || blob.size > MAX_IMAGE_BYTES) {
    throw new Error("No se pudo leer la imagen de perfil.");
  }
  return blob;
}