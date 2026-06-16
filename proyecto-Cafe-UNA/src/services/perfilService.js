import { apiRequest } from "./apiClient";
import { getActiveSessionUser } from "./sessionService";
import { obtenerUsuarioPorId } from "./usuariosServices";

const BASE_URL = `${import.meta.env.BACKEND_URL}/perfil`;

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
  try {
    const data = await request(BASE_URL);
    return normalizePerfil(data);
  } catch (error) {
    const sessionUser = getActiveSessionUser();
    if (!sessionUser?.id) {
      throw error;
    }

    try {
      const fallback = await obtenerUsuarioPorId(sessionUser.id);
      return normalizePerfil(fallback);
    } catch {
      throw error;
    }
  }
}

export async function actualizarPerfil(payload) {
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
