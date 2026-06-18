import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

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

function formatFechaDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function construirCeldasCalendario({
  mesActual,
  fechasSeleccionadas,
  fechaMin,
  fechaMax,
  hoy,
}) {
  const year = mesActual.getFullYear();
  const month = mesActual.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const minDate = parseISO(fechaMin);
  const maxDate = parseISO(fechaMax);

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
      esHoy: esMesActual && iso === toISO(hoy),
    });
  }

  return resultado;
}

function SelectorFecha({ name, value, onChange, min, placeholder = "Seleccionar fecha" }) {
  const [abierto, setAbierto] = useState(false);
  const [mesActual, setMesActual] = useState(() => parseISO(value) || new Date());
  const contenedorRef = useRef(null);

  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const celdas = useMemo(
    () =>
      construirCeldasCalendario({
        mesActual,
        fechasSeleccionadas: value ? [value] : [],
        fechaMin: min,
        fechaMax: null,
        hoy,
      }),
    [mesActual, value, min, hoy],
  );

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrarAlClickFuera = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", cerrarAlClickFuera);
    return () => document.removeEventListener("mousedown", cerrarAlClickFuera);
  }, [abierto]);

  useEffect(() => {
    const parsed = parseISO(value);
    if (parsed) setMesActual(parsed);
  }, [value]);

  const seleccionar = (iso) => {
    onChange(iso);
    setAbierto(false);
  };

  const borrar = () => {
    onChange("");
    setAbierto(false);
  };

  const irAHoy = () => {
    const iso = toISO(hoy);
    if (min && iso < min) return;
    onChange(iso);
    setMesActual(new Date(hoy));
    setAbierto(false);
  };

  return (
    <div className="selector-fecha" ref={contenedorRef}>
      <button
        type="button"
        name={name}
        className={`selector-fecha__trigger${value ? "" : " selector-fecha__trigger--vacio"}`}
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
      >
        <span>{value ? formatFechaDisplay(value) : placeholder}</span>
        <Calendar className="selector-fecha__icono" size={14} strokeWidth={2} aria-hidden="true" />
      </button>

      {abierto ? (
        <div className="selector-fecha__popover calendario-voluntariado calendario-voluntariado--selector" role="dialog" aria-label="Seleccionar fecha">
          <div className="calendario-voluntariado__nav">
            <button type="button" onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))} aria-label="Mes anterior">
              <ChevronLeft size={14} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <span>
              {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
            </span>
            <button type="button" onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))} aria-label="Mes siguiente">
              <ChevronRight size={14} strokeWidth={2.4} aria-hidden="true" />
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
                onClick={() => seleccionar(celda.iso)}
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

          <div className="calendario-voluntariado__acciones">
            <button type="button" className="calendario-voluntariado__accion" onClick={borrar}>
              Borrar
            </button>
            <button type="button" className="calendario-voluntariado__accion" onClick={irAHoy}>
              Hoy
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
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

  const celdas = useMemo(
    () =>
      construirCeldasCalendario({
        mesActual,
        fechasSeleccionadas,
        fechaMin,
        fechaMax,
        hoy,
      }),
    [mesActual, fechasSeleccionadas, fechaMin, fechaMax, hoy],
  );

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
          <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <span>
          {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
        </span>
        <button type="button" onClick={mesSiguiente} aria-label="Mes siguiente">
          <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
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

function SectionCard({ icon: Icon, title, hint, children }) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        {Icon ? <Icon className="section-card__icon-inline" size={16} strokeWidth={2} aria-hidden="true" /> : null}
        <div className="section-card__titles">
          <h4>{title}</h4>
          {hint ? <span className="section-card__hint">{hint}</span> : null}
        </div>
      </div>
      <div className="section-card__body">{children}</div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { CalendarioVoluntariado, SectionCard, SelectorFecha, toISO, parseISO };
