import { apiRequest } from "./apiClient";

const BASE = `${import.meta.env.BACKEND_URL}/v1/donaciones`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

export function normalizarNecesidad(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  return {
    id: Number(id),
    uuid: String(firstDefined(raw, ["uuid", "Uuid"]) || ""),
    titulo: String(firstDefined(raw, ["titulo", "Titulo"]) || "").trim(),
    descripcion: String(firstDefined(raw, ["descripcion", "Descripcion"]) || "").trim(),
    prioridad: String(firstDefined(raw, ["prioridad", "Prioridad"]) || "").toUpperCase(),
    cantidadRequerida: firstDefined(raw, ["cantidadRequerida", "CantidadRequerida"]) ?? null,
    estado: String(firstDefined(raw, ["estado", "Estado"]) || "").toUpperCase(),
  };
}

export function normalizarSolicitudDonacion(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  const fecha = firstDefined(raw, ["fechaPropuesta", "FechaPropuesta"]);
  return {
    id: Number(id),
    tipo: String(firstDefined(raw, ["tipo", "Tipo"]) || "").trim(),
    descripcion: String(firstDefined(raw, ["descripcion", "Descripcion"]) || "").trim(),
    fechaPropuesta: fecha ? String(fecha).slice(0, 10) : "",
    estado: String(firstDefined(raw, ["estado", "Estado"]) || "").trim(),
    necesidadTitulo: String(
      firstDefined(raw, ["necesidadTitulo", "NecesidadTitulo"]) || "",
    ).trim(),
    usuarioNombre: String(firstDefined(raw, ["usuarioNombre", "UsuarioNombre"]) || "").trim(),
    usuarioCorreo: String(firstDefined(raw, ["usuarioCorreo", "UsuarioCorreo"]) || "").trim(),
    donanteNombre: String(firstDefined(raw, ["donanteNombre", "DonanteNombre"]) || "").trim(),
    detalles: firstDefined(raw, ["detalles", "Detalles"]) || null,
    createdAt: firstDefined(raw, ["createdAt", "CreatedAt"]) || "",
  };
}

function textoDetalle(detalles, ...claves) {
  if (!detalles || typeof detalles !== "object") return "";
  for (const clave of claves) {
    const valor = detalles[clave];
    if (valor !== undefined && valor !== null && String(valor).trim()) {
      return String(valor).trim();
    }
  }
  return "";
}

function formatHoraDonacion(valor) {
  const crudo = String(valor || "").trim();
  if (!crudo) return "";
  const etiquetas = { manana: "Mañana", tarde: "Tarde", fines: "Fines de semana" };
  if (etiquetas[crudo]) return etiquetas[crudo];
  const match = crudo.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return crudo;
  const horas = Number(match[1]);
  const minutos = match[2];
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 || 12;
  return `${horas12}:${minutos} ${periodo}`;
}

export function camposSolicitudDonacion(row) {
  const detalles = row?.detalles && typeof row.detalles === "object" ? row.detalles : {};
  const fotos = Array.isArray(detalles.fotos) ? detalles.fotos : [];
  const horariosRaw = Array.isArray(detalles.horarios) ? detalles.horarios : [];
  const metodo = textoDetalle(detalles, "metodoEntrega", "MetodoEntrega");
  const tipoId = textoDetalle(detalles, "tipoIdentificacion", "TipoIdentificacion");
  const tipoDonante = textoDetalle(detalles, "tipoDonante", "TipoDonante") || "persona";
  const etiquetasMetodo = {
    entrega: "Lo entregaré personalmente",
    recoleccion: "Solicito la recolección a domicilio",
  };
  const etiquetasId = {
    cedula: "Cédula física",
    juridica: "Cédula jurídica",
    pasaporte: "Pasaporte",
  };

  return {
    donanteNombre: row?.donanteNombre || row?.usuarioNombre || "",
    tipoDonante: tipoDonante === "organizacion" ? "Organización" : "Persona",
    esOrganizacion: tipoDonante === "organizacion",
    nombre: textoDetalle(detalles, "nombre", "Nombre"),
    primerApellido: textoDetalle(detalles, "primerApellido", "PrimerApellido"),
    segundoApellido: textoDetalle(detalles, "segundoApellido", "SegundoApellido"),
    tipoIdentificacion: etiquetasId[tipoId] || tipoId,
    numeroIdentificacion: textoDetalle(detalles, "numeroIdentificacion", "NumeroIdentificacion"),
    correo: textoDetalle(detalles, "correo", "Correo") || row?.usuarioCorreo || "",
    telefono: textoDetalle(detalles, "telefono", "Telefono"),
    categoria: row?.necesidadTitulo || row?.tipo || "",
    descripcion: row?.descripcion || "",
    cantidadEstimada: textoDetalle(detalles, "cantidadEstimada", "CantidadEstimada"),
    estadoArticulos: textoDetalle(detalles, "estadoArticulos", "EstadoArticulos"),
    metodoEntrega: etiquetasMetodo[metodo] || metodo,
    direccionRecoleccion: textoDetalle(detalles, "direccionRecoleccion", "DireccionRecoleccion"),
    horaEntrega:
      formatHoraDonacion(textoDetalle(detalles, "horaEntrega", "HoraEntrega")) ||
      horariosRaw.map((item) => formatHoraDonacion(item)).filter(Boolean).join(", "),
    valorEstimado: textoDetalle(detalles, "valorEstimado", "ValorEstimado"),
    fechaSolicitud:
      textoDetalle(detalles, "fechaSolicitud", "FechaSolicitud") ||
      (textoDetalle(detalles, "fechaEntrega", "FechaEntrega")
        ? String(row?.createdAt || "").slice(0, 10)
        : row?.fechaPropuesta || String(row?.createdAt || "").slice(0, 10)),
    fechaEntrega:
      textoDetalle(detalles, "fechaEntrega", "FechaEntrega") || row?.fechaPropuesta || "",
    estado: row?.estado || "",
    fotos: fotos.filter((foto) => String(foto?.url || foto?.Url || "").startsWith("data:image")),
  };
}

export function resumenSolicitudDonacion(row) {
  const campos = camposSolicitudDonacion(row);
  return {
    fotoUrl: String(campos.fotos[0]?.url || campos.fotos[0]?.Url || "").trim(),
    valorEstimado: campos.valorEstimado,
    estadoArticulos: campos.estadoArticulos,
    fotos: campos.fotos,
  };
}

export async function obtenerNecesidadesPublicas() {
  const data = await apiRequest(`${BASE}/necesidades`, {
    skipAuth: true,
    errorPrefix: "Error al consultar necesidades",
  });
  return (Array.isArray(data) ? data : []).map(normalizarNecesidad).filter(Boolean);
}

export async function obtenerNecesidadesAdmin() {
  const data = await apiRequest(`${BASE}/necesidades/gestion`, {
    errorPrefix: "Error al consultar necesidades",
  });
  return (Array.isArray(data) ? data : []).map(normalizarNecesidad).filter(Boolean);
}

export async function crearNecesidad(payload) {
  return normalizarNecesidad(
    await apiRequest(`${BASE}/necesidades`, {
      method: "POST",
      body: JSON.stringify(payload),
      errorPrefix: "Error al crear la necesidad",
    }),
  );
}

export async function actualizarNecesidad(id, payload) {
  return normalizarNecesidad(
    await apiRequest(`${BASE}/necesidades/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      errorPrefix: "Error al actualizar la necesidad",
    }),
  );
}

export async function inactivarNecesidad(id) {
  return normalizarNecesidad(
    await apiRequest(`${BASE}/necesidades/${id}/inactivar`, {
      method: "PATCH",
      errorPrefix: "Error al inactivar la necesidad",
    }),
  );
}

export async function enviarSolicitudDonacion(payload) {
  return normalizarSolicitudDonacion(
    await apiRequest(`${BASE}/solicitudes`, {
      method: "POST",
      body: JSON.stringify(payload),
      errorPrefix: "Error al enviar la solicitud de donación",
    }),
  );
}

export async function obtenerMisSolicitudesDonacion() {
  const data = await apiRequest(`${BASE}/solicitudes/mias`, {
    errorPrefix: "Error al consultar donaciones",
  });
  return (Array.isArray(data) ? data : []).map(normalizarSolicitudDonacion).filter(Boolean);
}

export async function obtenerSolicitudesDonacionAdmin() {
  const data = await apiRequest(`${BASE}/solicitudes`, {
    errorPrefix: "Error al consultar solicitudes de donación",
  });
  return (Array.isArray(data) ? data : []).map(normalizarSolicitudDonacion).filter(Boolean);
}

export async function actualizarEstadoSolicitudDonacion(id, estado) {
  return normalizarSolicitudDonacion(
    await apiRequest(`${BASE}/solicitudes/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
      errorPrefix: "Error al actualizar el estado de la donación",
    }),
  );
}
