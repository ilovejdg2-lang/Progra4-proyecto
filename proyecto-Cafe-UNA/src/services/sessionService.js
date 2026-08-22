import { getTokenExpirationMs } from "../lib/jwt";

const USER_STORAGE_KEY = 'user';
const SESSION_DURATION_MS = 60 * 60 * 1000;
const TOUCH_THROTTLE_MS = 5 * 60 * 1000;
export const SESSION_UPDATED_EVENT = 'session-updated';

let lastTouchAt = 0;
let loggingOut = false;

export function isLoggingOut() {
  return loggingOut;
}

export function beginLogout() {
  loggingOut = true;
}

function notifySessionChange() {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function clearSession() {
  loggingOut = true;
  localStorage.removeItem(USER_STORAGE_KEY);
  lastTouchAt = 0;
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
  if (!user) return true;

  const tokenExp = user.token ? getTokenExpirationMs(user.token) : null;
  if (tokenExp && tokenExp <= Date.now()) {
    return true;
  }

  return Boolean(user.expiresAt && Number(user.expiresAt) <= Date.now());
}

export function touchSession() {
  if (loggingOut) return null;

  const user = getStoredUser();
  if (!user || isSessionExpired(user)) {
    return null;
  }

  const now = Date.now();
  if (now - lastTouchAt < TOUCH_THROTTLE_MS) {
    return user;
  }

  lastTouchAt = now;
  const updated = {
    ...user,
    expiresAt: now + SESSION_DURATION_MS,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  notifySessionChange();
  return updated;
}

export function getActiveSessionUser() {
  if (loggingOut) return null;

  const user = getStoredUser();
  if (isSessionExpired(user)) {
    clearSession();
    return null;
  }

  return touchSession() ?? user;
}

export function saveAuthenticatedUser(user) {
  loggingOut = false;
  lastTouchAt = Date.now();
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
