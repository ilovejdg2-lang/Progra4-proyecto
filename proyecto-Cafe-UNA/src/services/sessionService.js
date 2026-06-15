const USER_STORAGE_KEY = 'user';
const SESSION_DURATION_MS = 60 * 60 * 1000;
export const SESSION_UPDATED_EVENT = 'session-updated';

function notifySessionChange() {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function clearSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  notifySessionChange();
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
  } catch {
    clearSession();
    return null;
  }
}

export function isSessionExpired(user) {
  return Boolean(user?.expiresAt && Number(user.expiresAt) <= Date.now());
}

export function getActiveSessionUser() {
  const user = getStoredUser();
  if (isSessionExpired(user)) {
    clearSession();
    return null;
  }

  return user;
}

export function saveAuthenticatedUser(user) {
  const sessionUser = {
    ...user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
  notifySessionChange();
  return sessionUser;
}

export function applyPerfilToSession(perfil) {
  if (!perfil) return null;

  return updateSessionUser({
    name: perfil.nombre,
    username: perfil.nombre,
    email: perfil.correo,
    correo: perfil.correo,
    fotoPerfilUrl: perfil.fotoPerfilUrl || "",
    fotoBannerUrl: perfil.fotoBannerUrl || "",
    fotoPerfilPosicion: perfil.fotoPerfilPosicion || "",
    fotoBannerPosicion: perfil.fotoBannerPosicion || "",
  });
}

export function updateSessionUser(partial) {
  const current = getStoredUser();
  if (!current) return null;
  return saveAuthenticatedUser({ ...current, ...partial });
}
