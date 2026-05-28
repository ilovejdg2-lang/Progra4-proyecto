import axios from "axios";

export async function apiRequest(url, options = {}) {
  const {
    body,
    data,
    errorPrefix = "Error en la solicitud",
    headers,
    method = "GET",
    timeout = 10000,
    timeoutMessage = "Tiempo de espera agotado al consultar el servidor.",
    ...config
  } = options;

  try {
    const response = await axios({
      url,
      method,
      data: data ?? parseBody(body),
      headers: { "Content-Type": "application/json", ...(headers || {}) },
      timeout,
      ...config,
    });

    return response.status === 204 ? null : response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(timeoutMessage, { cause: error });
    }

    if (error.response) {
      const message = error.response.data?.message || `${errorPrefix} (${error.response.status})`;
      throw new Error(message, { cause: error });
    }

    throw error;
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
