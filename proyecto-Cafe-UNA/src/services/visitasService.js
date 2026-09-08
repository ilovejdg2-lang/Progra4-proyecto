import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/visitas/solicitudes`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

export function normalizarVisita(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;

  return {
    id: String(id),
    userId: firstDefined(raw, ["userId", "UserId"]) ?? null,
    fechaSolicitud: String(firstDefined(raw, ["fechaSolicitud", "FechaSolicitud"]) || ""),
    estado: String(firstDefined(raw, ["estado", "Estado"]) || "Pendiente").trim(),
    
    // Encargado
    encargadoNombre: String(firstDefined(raw, ["encargadoNombre", "EncargadoNombre"]) || "").trim(),
    encargadoIdentificacion: String(firstDefined(raw, ["encargadoIdentificacion", "EncargadoIdentificacion"]) || "").trim(),
    encargadoEmail: String(firstDefined(raw, ["encargadoEmail", "EncargadoEmail"]) || "").trim(),
    encargadoTelefono: String(firstDefined(raw, ["encargadoTelefono", "EncargadoTelefono"]) || "").trim(),
    encargadoInstitucion: String(firstDefined(raw, ["encargadoInstitucion", "EncargadoInstitucion"]) || "").trim(),

    // Grupo y Procedencia
    tipoVisitante: String(firstDefined(raw, ["tipoVisitante", "TipoVisitante"]) || "Nacional").trim(),
    paisProcedencia: String(firstDefined(raw, ["paisProcedencia", "PaisProcedencia"]) || "").trim(),
    ciudadProvincia: String(firstDefined(raw, ["ciudadProvincia", "CiudadProvincia"]) || "").trim(),
    cantidadVisitantes: Number(firstDefined(raw, ["cantidadVisitantes", "CantidadVisitantes"]) ?? 0),
    tipoGrupo: String(firstDefined(raw, ["tipoGrupo", "TipoGrupo"]) || "").trim(),
    tipoGrupoOtro: String(firstDefined(raw, ["tipoGrupoOtro", "TipoGrupoOtro"]) || "").trim(),

    // Logística
    fechaVisita: String(firstDefined(raw, ["fechaVisita", "FechaVisita"]) || "").trim(),
    horaPreferida: String(firstDefined(raw, ["horaPreferida", "HoraPreferida"]) || "").trim(),
    fechaAlternativa: String(firstDefined(raw, ["fechaAlternativa", "FechaAlternativa"]) || "").trim(),
    duracionEstimada: String(firstDefined(raw, ["duracionEstimada", "DuracionEstimada"]) || "").trim(),
    areaVisita: String(firstDefined(raw, ["areaVisita", "AreaVisita"]) || "").trim(),

    // Motivo y Requerimientos
    motivoVisita: String(firstDefined(raw, ["motivoVisita", "MotivoVisita"]) || "").trim(),
    motivoOtro: String(firstDefined(raw, ["motivoOtro", "MotivoOtro"]) || "").trim(),
    requiereAccesibilidad: Boolean(firstDefined(raw, ["requiereAccesibilidad", "RequiereAccesibilidad"])),
    requiereParqueoBus: Boolean(firstDefined(raw, ["requiereParqueoBus", "RequiereParqueoBus"])),
    requiereGuia: Boolean(firstDefined(raw, ["requiereGuia", "RequiereGuia"])),
    observaciones: String(firstDefined(raw, ["observaciones", "Observaciones"]) || "").trim(),
    observacionesAdmin: String(firstDefined(raw, ["observacionesAdmin", "ObservacionesAdmin"]) || "").trim(),
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
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.tipoVisitante) params.set("tipoVisitante", filtros.tipoVisitante);
  if (filtros.fechaDesde) params.set("fechaDesde", filtros.fechaDesde);
  if (filtros.fechaHasta) params.set("fechaHasta", filtros.fechaHasta);
  if (filtros.busqueda) params.set("busqueda", filtros.busqueda);

  const queryStr = params.toString();
  const url = queryStr ? `${BASE_URL}?${queryStr}` : BASE_URL;

  const data = await apiRequest(url, {
    errorPrefix: "Error al consultar solicitudes de visitas",
  });

  const list = Array.isArray(data) ? data : data?.items || [];
  return list.map(normalizarVisita).filter(Boolean);
}

export async function obtenerSolicitudesVisitaDeUsuario(userId) {
  const data = await apiRequest(`${BASE_URL}/usuario/${userId}`, {
    errorPrefix: "Error al consultar las solicitudes de visita del usuario",
  });

  const list = Array.isArray(data) ? data : [];
  return list.map(normalizarVisita).filter(Boolean);
}

export async function actualizarSolicitudVisita(id, cambios) {
  const raw = await apiRequest(`${BASE_URL}/${id}`, {
    method: "PUT",
    data: cambios,
    errorPrefix: "Error al actualizar la solicitud de visita",
  });

  return normalizarVisita(raw);
}

export async function eliminarSolicitudVisita(id) {
  return apiRequest(`${BASE_URL}/${id}`, {
    method: "DELETE",
    errorPrefix: "Error al inactivar la solicitud de visita",
  });
}
