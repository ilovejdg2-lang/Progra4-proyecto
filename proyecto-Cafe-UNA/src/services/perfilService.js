import { apiRequest } from "./apiClient";
import { getActiveSessionUser, getStoredUser, isSessionExpired } from "./sessionService";
import { obtenerUsuarioPorId } from "./usuariosServices";

const BASE_URL = `${import.meta.env.BACKEND_URL}/perfil`;
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
      const normalized = normalizePerfil(data);
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
