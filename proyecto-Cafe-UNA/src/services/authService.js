const AUTH_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/auth`;

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Error de autenticación (${res.status})`);
  }

  return data;
}

export async function registrarUsuario(payload) {
  return request(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function solicitarRecuperacion(identifier) {
  return request(`${AUTH_BASE_URL}/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export async function restablecerPassword(payload) {
  return request(`${AUTH_BASE_URL}/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
