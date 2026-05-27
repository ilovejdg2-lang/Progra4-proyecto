const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/informacion`;

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let message = `Error en informacion (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore parse error and keep fallback message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export async function obtenerInformacion() {
  return request(BASE_URL);
}

export async function obtenerSeccion(seccion) {
  return request(`${BASE_URL}/${encodeURIComponent(seccion)}`);
}

export async function actualizarInformacion(nuevaInformacion) {
  return request(BASE_URL, {
    method: "PUT",
    body: JSON.stringify(nuevaInformacion),
  });
}

export async function actualizarSeccion(seccion, cambios) {
  return request(`${BASE_URL}/${encodeURIComponent(seccion)}`, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });
}

export async function agregarGaleriaItem(item) {
  return request(`${BASE_URL}/galeria`, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function actualizarGaleriaItem(id, cambios) {
  return request(`${BASE_URL}/galeria/${id}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
}

export async function eliminarGaleriaItem(id) {
  await request(`${BASE_URL}/galeria/${id}`, { method: "DELETE" });
  return true;
}

export async function obtenerHero() {
  return request(`${BASE_URL}/hero`);
}

export async function obtenerInformacionSobreNosotros() {
  const [historia, mission, vision, gallery] = await Promise.all([
    obtenerSeccion("historia").catch(() => ({})),
    obtenerSeccion("mission").catch(() => ({})),
    obtenerSeccion("vision").catch(() => ({})),
    obtenerSeccion("gallery").catch(() => []),
  ]);

  return {
    historia: historia ?? {},
    mission: mission ?? {},
    vision: vision ?? {},
    gallery: Array.isArray(gallery) ? gallery : [],
  };
}