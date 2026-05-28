const USER_STORAGE_KEY = 'user';
const SESSION_DURATION_MS = 60 * 60 * 1000;

export function clearSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event('storage'));
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
  window.dispatchEvent(new Event('storage'));
  return sessionUser;
}
