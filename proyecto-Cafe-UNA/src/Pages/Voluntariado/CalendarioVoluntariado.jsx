import { useMemo } from "react";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DIAS_CABECERA = ["L", "M", "X", "J", "V", "S", "D"];

function toISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISO(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function CalendarioVoluntariado({
  mesActual,
  setMesActual,
  fechasSeleccionadas,
  onToggleFecha,
  fechaMin,
  fechaMax,
}) {
  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minDate = parseISO(fechaMin);
  const maxDate = parseISO(fechaMax);

  const celdas = useMemo(() => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    let inicioSemana = primerDia.getDay() - 1;
    if (inicioSemana < 0) inicioSemana = 6;

    const totalCeldas = Math.ceil((inicioSemana + ultimoDia.getDate()) / 7) * 7;
    const resultado = [];

    for (let i = 0; i < totalCeldas; i++) {
      const diaNum = i - inicioSemana + 1;
      const fecha = new Date(year, month, diaNum);
      const iso = toISO(fecha);
      const esMesActual = diaNum >= 1 && diaNum <= ultimoDia.getDate();

      let deshabilitado = !esMesActual;
      if (esMesActual) {
        if (minDate && fecha < minDate) deshabilitado = true;
        if (maxDate && fecha > maxDate) deshabilitado = true;
        if (fecha < hoy) deshabilitado = true;
      }

      resultado.push({
        dia: esMesActual ? diaNum : null,
        iso,
        esMesActual,
        deshabilitado,
        seleccionado: fechasSeleccionadas.includes(iso),
        esHoy: esMesActual && toISO(fecha) === toISO(hoy),
      });
    }

    return resultado;
  }, [mesActual, fechasSeleccionadas, fechaMin, fechaMax, hoy]);

  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
  };

  return (
    <div className="calendario-voluntariado calendario-voluntariado--compacto">
      <div className="calendario-voluntariado__nav">
        <button type="button" onClick={mesAnterior} aria-label="Mes anterior">
          <i className="fas fa-chevron-left" aria-hidden="true" />
        </button>
        <span>
          {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
        </span>
        <button type="button" onClick={mesSiguiente} aria-label="Mes siguiente">
          <i className="fas fa-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div className="calendario-voluntariado__grid">
        {DIAS_CABECERA.map((d) => (
          <span key={d} className="calendario-voluntariado__cabecera">
            {d}
          </span>
        ))}

        {celdas.map((celda, idx) => (
          <button
            key={`${celda.iso}-${idx}`}
            type="button"
            className={[
              "calendario-voluntariado__dia",
              !celda.esMesActual && "calendario-voluntariado__dia--vacio",
              celda.seleccionado && "calendario-voluntariado__dia--seleccionado",
              celda.esHoy && "calendario-voluntariado__dia--hoy",
              celda.deshabilitado && "calendario-voluntariado__dia--deshabilitado",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={!celda.esMesActual || celda.deshabilitado}
            onClick={() => onToggleFecha(celda.iso)}
            aria-label={
              celda.esMesActual
                ? `Día ${celda.dia}${celda.seleccionado ? ", seleccionado" : ""}`
                : undefined
            }
          >
            {celda.dia}
          </button>
        ))}
      </div>

      {fechasSeleccionadas.length > 0 ? (
        <p className="calendario-voluntariado__resumen">
          {fechasSeleccionadas.length} día
          {fechasSeleccionadas.length !== 1 ? "s" : ""} marcado
          {fechasSeleccionadas.length !== 1 ? "s" : ""}
        </p>
      ) : (
        <p className="calendario-voluntariado__hint">Seleccione sus días disponibles</p>
      )}
    </div>
  );
}

function SectionCard({ icon, title, hint, children }) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        {icon ? <i className={`${icon} section-card__icon-inline`} aria-hidden="true" /> : null}
        <div className="section-card__titles">
          <h4>{title}</h4>
          {hint ? <span className="section-card__hint">{hint}</span> : null}
        </div>
      </div>
      <div className="section-card__body">{children}</div>
    </div>
  );
}

export { CalendarioVoluntariado, SectionCard, toISO, parseISO };
