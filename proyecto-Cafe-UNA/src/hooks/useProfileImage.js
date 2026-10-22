import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getTokenExpirationMs } from "../lib/jwt";
import { classifyProfileImageSource, obtenerImagenPerfil } from "../services/perfilService";
import { getStoredUser, isLoggingOut, isSessionExpired, SESSION_UPDATED_EVENT } from "../services/sessionService";

function activeSession() {
  const user = getStoredUser();
  return user?.id && user.token && !isLoggingOut() && !isSessionExpired(user) ? user : null;
}

function sessionSnapshot() {
  const user = activeSession();
  return user ? JSON.stringify([String(user.id), user.token, user.expiresAt]) : "";
}

function subscribeSession(onChange) {
  let timer;
  const schedule = () => {
    window.clearTimeout(timer);
    const user = activeSession();
    if (!user) return;
    const deadlines = [Number(user.expiresAt), getTokenExpirationMs(user.token)].filter((value) => Number.isFinite(value) && value > 0);
    if (deadlines.length) {
      timer = window.setTimeout(sync, Math.min(Math.max(0, Math.min(...deadlines) - Date.now()), 2_147_483_647));
    }
  };
  const sync = () => {
    schedule();
    onChange();
  };
  window.addEventListener("storage", sync);
  window.addEventListener(SESSION_UPDATED_EVENT, sync);
  schedule();
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("storage", sync);
    window.removeEventListener(SESSION_UPDATED_EVENT, sync);
  };
}

export function useProfileImage(source) {
  const snapshot = useSyncExternalStore(subscribeSession, sessionSnapshot, () => "");
  const [userId, token] = snapshot ? JSON.parse(snapshot) : [];
  const request = useMemo(() => ({ source, userId, token }), [source, userId, token]);
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    if (!request.userId || !request.token || classifyProfileImageSource(request.source).kind !== "private") return undefined;
    const controller = new AbortController();
    let active = true;
    let objectUrl = "";
    obtenerImagenPerfil(request.source, controller.signal)
      .then((blob) => {
        const current = activeSession();
        if (!active || String(current?.id) !== request.userId || current?.token !== request.token) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ request, url: objectUrl });
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [request]);

  const image = classifyProfileImageSource(source);
  if (image.kind === "external") return image.url;
  return image.kind === "private" && loaded?.request === request ? loaded.url : "";
}
