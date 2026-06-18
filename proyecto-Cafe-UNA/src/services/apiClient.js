import axios from "axios";
import { getTokenExpirationMs } from "../lib/jwt";
import { sanitizeUserFacingError } from "../lib/formLimits";
import { clearSession, getActiveSessionUser, touchSession, updateSessionUser } from "./sessionService";

const REFRESH_BEFORE_MS = 15 * 60 * 1000;
let refreshPromise = null;

async function ensureFreshToken(sessionUser) {
  if (!sessionUser?.token) {
    return sessionUser;
  }

  const tokenExp = getTokenExpirationMs(sessionUser.token);
  if (!tokenExp || tokenExp - Date.now() > REFRESH_BEFORE_MS) {
    return sessionUser;
  }

  if (!refreshPromise) {
    refreshPromise = import("./authService")
      .then(({ renovarToken }) => renovarToken())
      .then((result) => {
        const token = result?.token || result?.Token;
        if (!token) {
          throw new Error("No se pudo renovar la sesión.");
        }
        return updateSessionUser({ token });
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function refreshSessionIfNeeded() {
  const user = getActiveSessionUser();
  if (!user?.token) {
    return null;
  }

  try {
    return await ensureFreshToken(user);
  } catch {
    return user;
  }
}

export async function apiRequest(url, options = {}) {
  const {
    body,
    data,
    errorPrefix = "Error en la solicitud",
    headers,
    method = "GET",
    skipAuth = false,
    skipRefresh = false,
    timeout,
    timeoutMessage = "Tiempo de espera agotado al consultar el servidor.",
    ...config
  } = options;

  let sessionUser = skipAuth ? null : getActiveSessionUser();
  if (!skipAuth && !skipRefresh && sessionUser?.token) {
    sessionUser = (await ensureFreshToken(sessionUser)) ?? sessionUser;
  }

  const isGet = (method || "GET").toUpperCase() === "GET";
  const requestTimeout = typeof timeout === "number" ? timeout : (isGet ? 20000 : 30000);

  try {
    const authHeaders = sessionUser?.token
      ? { Authorization: `Bearer ${sessionUser.token}` }
      : {};

    const response = await axios({
      url,
      method,
      data: data ?? parseBody(body),
      headers: {
        ...(isGet ? {} : { "Content-Type": "application/json" }),
        ...authHeaders,
        ...(headers || {}),
      },
      timeout: requestTimeout,
      ...config,
    });

    if (!skipAuth && sessionUser?.token) {
      touchSession();
    }

    return response.status === 204 ? null : response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(
        timeoutMessage || "El servidor tardó demasiado en responder. Intente de nuevo.",
        { cause: error },
      );
    }

    if (error.code === "ERR_NETWORK") {
      throw new Error(
        "No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.",
        { cause: error },
      );
    }

    if (error.response) {
      if (error.response.status === 401 && skipAuth) {
        throw new Error("Credenciales incorrectas", { cause: error });
      }

      if (error.response.status === 401 && sessionUser?.token) {
        clearSession();
        throw new Error("Su sesión expiró. Inicie sesión de nuevo.", { cause: error });
      }

      const responseData = error.response.data;
      const rawMessage = typeof responseData === "string"
        ? responseData
        : responseData?.message || `${errorPrefix} (${error.response.status})`;
      throw new Error(sanitizeUserFacingError(rawMessage), { cause: error });
    }

    throw new Error(
      sanitizeUserFacingError(error.message || "No se pudo completar la acción."),
      { cause: error },
    );
  }
}

function parseBody(body) {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}
