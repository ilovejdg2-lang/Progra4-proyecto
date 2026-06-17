import axios from "axios";
import { sanitizeUserFacingError } from "../lib/formLimits";
import { clearSession, getActiveSessionUser } from "./sessionService";

export async function apiRequest(url, options = {}) {
  const {
    body,
    data,
    errorPrefix = "Error en la solicitud",
    headers,
    method = "GET",
    skipAuth = false,
    timeout,
    timeoutMessage = "Tiempo de espera agotado al consultar el servidor.",
    ...config
  } = options;

  const sessionUser = skipAuth ? null : getActiveSessionUser();

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

    return response.status === 204 ? null : response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(
        timeoutMessage || "El servidor tardó demasiado en responder. Intente de nuevo.",
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

    if (error.code === "ERR_NETWORK") {
      throw new Error(sanitizeUserFacingError(""), { cause: error });
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
