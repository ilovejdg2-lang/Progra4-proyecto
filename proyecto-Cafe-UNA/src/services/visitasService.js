import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/visitas/solicitudes`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

function stringField(raw, camelCase, pascalCase, fallback = "") {
  return String(firstDefined(raw, [camelCase, pascalCase]) ?? fallback).trim();
}

export function normalizarVisita(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;

  return {
    id: String(id),
    userId: firstDefined(raw, ["userId", "UserId"]) ?? null,
    fechaSolicitud: stringField(raw, "fechaSolicitud", "FechaSolicitud"),
    estado: stringField(raw, "estado", "Estado", "Pendiente"),
    encargadoNombre: stringField(raw, "encargadoNombre", "EncargadoNombre"),
    encargadoIdentificacion: stringField(
      raw,
      "encargadoIdentificacion",
      "EncargadoIdentificacion",
    ),
    encargadoEmail: stringField(raw, "encargadoEmail", "EncargadoEmail"),
    encargadoTelefono: stringField(raw, "encargadoTelefono", "EncargadoTelefono"),
    encargadoInstitucion: stringField(
      raw,
      "encargadoInstitucion",
      "EncargadoInstitucion",
    ),
    tipoVisitante: stringField(raw, "tipoVisitante", "TipoVisitante", "Nacional"),
    paisProcedencia: stringField(raw, "paisProcedencia", "PaisProcedencia"),
    ciudadProvincia: stringField(raw, "ciudadProvincia", "CiudadProvincia"),
    cantidadVisitantes: Number(
      firstDefined(raw, ["cantidadVisitantes", "CantidadVisitantes"]) ?? 0,
    ),
    tipoGrupo: stringField(raw, "tipoGrupo", "TipoGrupo"),
    tipoGrupoOtro: stringField(raw, "tipoGrupoOtro", "TipoGrupoOtro"),
    fechaVisita: stringField(raw, "fechaVisita", "FechaVisita"),
    horaPreferida: stringField(raw, "horaPreferida", "HoraPreferida"),
    fechaAlternativa: stringField(raw, "fechaAlternativa", "FechaAlternativa"),
    duracionEstimada: stringField(raw, "duracionEstimada", "DuracionEstimada"),
    areaVisita: stringField(raw, "areaVisita", "AreaVisita"),
    motivoVisita: stringField(raw, "motivoVisita", "MotivoVisita"),
    motivoOtro: stringField(raw, "motivoOtro", "MotivoOtro"),
    requiereAccesibilidad: Boolean(
      firstDefined(raw, ["requiereAccesibilidad", "RequiereAccesibilidad"]),
    ),
    requiereParqueoBus: Boolean(
      firstDefined(raw, ["requiereParqueoBus", "RequiereParqueoBus"]),
    ),
    requiereGuia: Boolean(firstDefined(raw, ["requiereGuia", "RequiereGuia"])),
    observaciones: stringField(raw, "observaciones", "Observaciones"),
    observacionesAdmin: stringField(raw, "observacionesAdmin", "ObservacionesAdmin"),
  };
}

export async function crearSolicitudVisita(datos) {
  const payload = {
    EncargadoNombre: datos.encargadoNombre,
    EncargadoIdentificacion: datos.encargadoIdentificacion,
    EncargadoEmail: datos.encargadoEmail,
    EncargadoTelefono: datos.encargadoTelefono,
    EncargadoInstitucion: datos.encargadoInstitucion || null,
    TipoVisitante: datos.tipoVisitante,
    PaisProcedencia: datos.paisProcedencia || null,
    CiudadProvincia: datos.ciudadProvincia,
    CantidadVisitantes: Number(datos.cantidadVisitantes),
    TipoGrupo: datos.tipoGrupo,
    TipoGrupoOtro: datos.tipoGrupoOtro || null,
    FechaVisita: datos.fechaVisita,
    HoraPreferida: datos.horaPreferida,
    FechaAlternativa: datos.fechaAlternativa || null,
    DuracionEstimada: datos.duracionEstimada || null,
    AreaVisita: datos.areaVisita || null,
    MotivoVisita: datos.motivoVisita,
    MotivoOtro: datos.motivoOtro || null,
    RequiereAccesibilidad: Boolean(datos.requiereAccesibilidad),
    RequiereParqueoBus: Boolean(datos.requiereParqueoBus),
    RequiereGuia: Boolean(datos.requiereGuia),
    Observaciones: datos.observaciones || null,
  };

  const raw = await apiRequest(BASE_URL, {
    method: "POST",
    data: payload,
    errorPrefix: "Error al crear la solicitud de visita grupal",
  });
  return normalizarVisita(raw);
}

export async function obtenerSolicitudesVisitas(filtros = {}) {
  const params = new URLSearchParams();
  for (const key of ["estado", "tipoVisitante", "fechaDesde", "fechaHasta", "busqueda"]) {
    const value = String(filtros[key] ?? "").trim();
    if (value) params.set(key, value);
  }

  const query = params.toString();
  const data = await apiRequest(query ? `${BASE_URL}?${query}` : BASE_URL, {
    errorPrefix: "Error al consultar solicitudes de visitas",
  });
  const list = Array.isArray(data) ? data : data?.items || [];
  return list.map(normalizarVisita).filter(Boolean);
}

export async function obtenerSolicitudesVisitaDeUsuario(userId) {
  const data = await apiRequest(`${BASE_URL}/usuario/${userId}`, {
    errorPrefix: "Error al consultar las solicitudes de visita del usuario",
  });
  return (Array.isArray(data) ? data : []).map(normalizarVisita).filter(Boolean);
}

export async function actualizarSolicitudVisita(id, cambios) {
  const raw = await apiRequest(`${BASE_URL}/${id}`, {
    method: "PUT",
    data: cambios,
    errorPrefix: "Error al actualizar la solicitud de visita",
  });
  return normalizarVisita(raw);
}

export function eliminarSolicitudVisita(id) {
  return apiRequest(`${BASE_URL}/${id}`, {
    method: "DELETE",
    errorPrefix: "Error al inactivar la solicitud de visita",
  });
}
