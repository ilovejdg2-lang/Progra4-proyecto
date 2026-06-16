import axios from "axios";
import { clearSession, getActiveSessionUser } from "./sessionService";

export async function apiRequest(url, options = {}) {
  const {
    body,
    data,
    errorPrefix = "Error en la solicitud",
    headers,
    method = "GET",
    skipAuth = false,
    timeout = 45000,
    timeoutMessage = "Tiempo de espera agotado al consultar el servidor.",
    ...config
  } = options;

  const sessionUser = skipAuth ? null : getActiveSessionUser();

  try {
    const authHeaders = sessionUser?.token
      ? { Authorization: `Bearer ${sessionUser.token}` }
      : {};

    const isGet = (method || "GET").toUpperCase() === "GET";
    const response = await axios({
      url,
      method,
      data: data ?? parseBody(body),
      headers: {
        ...(isGet ? {} : { "Content-Type": "application/json" }),
        ...authHeaders,
        ...(headers || {}),
      },
      timeout,
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
      const message = typeof responseData === "string"
        ? responseData
        : responseData?.message || `${errorPrefix} (${error.response.status})`;
      throw new Error(message, { cause: error });
    }

    if (error.code === "ERR_NETWORK") {
      throw new Error(
        "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.",
        { cause: error },
      );
    }

    throw new Error(error.message || "Error de red al conectar con el servidor.", { cause: error });
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
