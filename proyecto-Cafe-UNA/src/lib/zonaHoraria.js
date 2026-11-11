export const ZONA_HORARIA_PREDETERMINADA = "America/Costa_Rica";

function crearFormatoHoy(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const FORMATO_HOY_PREDETERMINADO = crearFormatoHoy(ZONA_HORARIA_PREDETERMINADA);

/** Fecha de hoy en YYYY-MM-DD según la zona (Costa Rica por defecto). */
export function obtenerHoyIso(timeZone = ZONA_HORARIA_PREDETERMINADA) {
  if (timeZone === ZONA_HORARIA_PREDETERMINADA) {
    return FORMATO_HOY_PREDETERMINADO.format(new Date());
  }
  try {
    return crearFormatoHoy(timeZone).format(new Date());
  } catch {
    return FORMATO_HOY_PREDETERMINADO.format(new Date());
  }
}
