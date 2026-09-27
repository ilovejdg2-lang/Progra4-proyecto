import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  SESSION_UPDATED_EVENT,
  clearSession,
  getStoredUser,
  isManualLogout,
  isSessionExpired,
} from "../services/sessionService";

const INTERVALO_REVISION_MS = 30 * 1000;

/**
 * Manda a /login si la sesión es nula o venció (1 h sin actividad).
 * Usa getStoredUser en vez de getActiveSessionUser para que revisar no renueve la sesión.
 */
export function useSesionProtegida() {
  const navigate = useNavigate();

  useEffect(() => {
    const revisar = () => {
      if (isManualLogout()) return;
      const user = getStoredUser();
      if (user && !isSessionExpired(user)) return;

      if (user) clearSession();
      sessionStorage.setItem(
        "postLoginRedirect",
        `${window.location.pathname}${window.location.search}`,
      );
      navigate({ to: "/login", replace: true });
    };

    const alVolver = () => {
      if (document.visibilityState === "visible") revisar();
    };

    revisar();
    const intervalo = window.setInterval(revisar, INTERVALO_REVISION_MS);
    window.addEventListener(SESSION_UPDATED_EVENT, revisar);
    window.addEventListener("storage", revisar);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener(SESSION_UPDATED_EVENT, revisar);
      window.removeEventListener("storage", revisar);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [navigate]);
}
