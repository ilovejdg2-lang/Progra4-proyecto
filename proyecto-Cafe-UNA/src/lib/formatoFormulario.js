import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";

const CUPO_BAJO = 5;

/** Capacity text for a time slot: state drives the dot colour, text is shown to the person. */
export function describirCupo({ cupoRestante, capacidadMaxima, agotada = false }) {
  const maximo = capacidadMaxima ?? 30;
  const restante = cupoRestante ?? maximo;
  if (agotada || restante <= 0) return { estado: "agotado", texto: "Cupo agotado" };
  if (restante <= CUPO_BAJO) {
    const texto =
      restante === 1 ? `Queda 1 cupo de ${maximo}` : `Quedan ${restante} cupos de ${maximo}`;
    return { estado: "bajo", texto };
  }
  return { estado: "disponible", texto: `${restante} cupos disponibles de ${maximo}` };
}

/** "Sábado 14 de noviembre" / "Saturday, November 14": sentence case, no year. */
export function formatearFechaLarga(fecha, idioma = "es") {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return "";
  const texto =
    idioma === "en"
      ? format(fecha, "EEEE, MMMM d", { locale: enUS })
      : format(fecha, "EEEE d 'de' MMMM", { locale: es });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
