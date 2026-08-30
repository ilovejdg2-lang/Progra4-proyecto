import { apiRequest } from "./apiClient";

const BASE = `${import.meta.env.BACKEND_URL}/ajustes`;

function normalizarHora(valor) {
  const raw = String(valor ?? "").trim();
  if (!raw) return "";
  // "08:00:00" | "8:00" | "08:00" → "08:00"
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw.slice(0, 5);
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

function mapBloque(row) {
  if (!row) return null;
  const fechaRaw = row.fecha ?? row.Fecha ?? "";
  const fecha =
    fechaRaw instanceof Date
      ? `${fechaRaw.getFullYear()}-${String(fechaRaw.getMonth() + 1).padStart(2, "0")}-${String(fechaRaw.getDate()).padStart(2, "0")}`
      : String(fechaRaw).slice(0, 10);
  return {
    id: row.id ?? row.Id,
    tipo: row.tipo ?? row.Tipo,
    fecha,
    horaInicio: normalizarHora(row.horaInicio ?? row.HoraInicio ?? ""),
    horaFin: normalizarHora(row.horaFin ?? row.HoraFin ?? ""),
    disponible: row.disponible ?? row.Disponible ?? true,
    cupoMaximo: row.cupoMaximo ?? row.CupoMaximo ?? null,
    nota: row.nota ?? row.Nota ?? "",
  };
}

function mapMatriz(data) {
  return {
    roles: data?.roles ?? data?.Roles ?? [],
    permisos: (data?.permisos ?? data?.Permisos ?? []).map((p) => ({
      codigo: p.codigo ?? p.Codigo,
      nombre: p.nombre ?? p.Nombre,
    })),
    matriz: data?.matriz ?? data?.Matriz ?? {},
  };
}

export async function obtenerIdiomaPredeterminado() {
  const data = await apiRequest(`${BASE}/idioma`, { skipAuth: true });
  return data?.idiomaPredeterminado ?? data?.IdiomaPredeterminado ?? "es";
}

export async function guardarIdiomaPredeterminado(idioma) {
  const data = await apiRequest(`${BASE}/idioma`, {
    method: "PUT",
    data: { idiomaPredeterminado: idioma },
  });
  return data?.idiomaPredeterminado ?? data?.IdiomaPredeterminado ?? idioma;
}

export async function obtenerReglasHorario() {
  const data = await apiRequest(`${BASE}/disponibilidad/reglas`, { skipAuth: true });
  return {
    horaApertura: data?.horaApertura ?? "08:00",
    horaCierre: data?.horaCierre ?? "17:00",
    diasLaborables: data?.diasLaborables ?? [1, 2, 3, 4, 5],
    mensaje:
      data?.mensaje ||
      "Lunes a viernes de 8:00 a. m. a 5:00 p. m. Sábados y domingos no están disponibles.",
  };
}

export async function listarDisponibilidad(tipo) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  const data = await apiRequest(`${BASE}/disponibilidad${qs}`);
  if (Array.isArray(data)) {
    return {
      reglas: await obtenerReglasHorario().catch(() => ({
        horaApertura: "08:00",
        horaCierre: "17:00",
        diasLaborables: [1, 2, 3, 4, 5],
        mensaje: "",
      })),
      excepciones: data.map(mapBloque).filter(Boolean),
    };
  }
  return {
    reglas: {
      horaApertura: data?.reglas?.horaApertura ?? "08:00",
      horaCierre: data?.reglas?.horaCierre ?? "17:00",
      diasLaborables: data?.reglas?.diasLaborables ?? [1, 2, 3, 4, 5],
      mensaje: data?.reglas?.mensaje ?? "",
    },
    excepciones: (data?.excepciones ?? []).map(mapBloque).filter(Boolean),
  };
}

export async function listarDisponibilidadPublica(tipo, desde, hasta) {
  const params = new URLSearchParams({ tipo: tipo || "visitas" });
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const data = await apiRequest(`${BASE}/disponibilidad/publica?${params}`, {
    skipAuth: true,
  });
  return Array.isArray(data) ? data : [];
}

export async function guardarExcepcionHorario(payload) {
  const data = await apiRequest(`${BASE}/disponibilidad`, {
    method: "POST",
    data: payload,
  });
  return mapBloque(data);
}

export async function actualizarDisponibilidad(id, payload) {
  const data = await apiRequest(`${BASE}/disponibilidad/${id}`, {
    method: "PUT",
    data: payload,
  });
  return mapBloque(data);
}

export async function eliminarDisponibilidad(id) {
  await apiRequest(`${BASE}/disponibilidad/${id}`, { method: "DELETE" });
}

export async function eliminarExcepcionPorFecha(tipo, fecha) {
  await apiRequest(
    `${BASE}/disponibilidad?tipo=${encodeURIComponent(tipo)}&fecha=${encodeURIComponent(fecha)}`,
    { method: "DELETE" },
  );
}

export async function crearDisponibilidad(payload) {
  return guardarExcepcionHorario(payload);
}

export async function obtenerMatrizPermisos() {
  const data = await apiRequest(`${BASE}/permisos`);
  return mapMatriz(data);
}

export async function guardarMatrizPermisos(matriz) {
  const data = await apiRequest(`${BASE}/permisos`, {
    method: "PUT",
    data: { matriz },
  });
  return mapMatriz(data);
}
