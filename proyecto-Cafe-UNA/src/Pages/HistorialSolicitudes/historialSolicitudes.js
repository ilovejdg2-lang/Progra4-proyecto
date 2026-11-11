export const OPCIONES_TIPO = [
  { value: "todos", label: "Todos" },
  { value: "voluntariado", label: "Voluntariado" },
  { value: "donacion", label: "Donación" },
  { value: "visita", label: "Visita grupal" },
  { value: "propuesta", label: "Propuesta" },
  { value: "documentacion", label: "Documentación" },
];

/** Enlace de detalle propio para filas del historial unificado. */
export function enlaceDetalleSolicitud(item) {
  if (!item || item.tipo !== "propuesta") return null;
  return {
    to: "/perfil/propuestas/$propuestaId",
    params: { propuestaId: String(item.identificador) },
  };
}
