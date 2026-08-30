import { useEffect, useMemo, useState } from "react";
import { format, startOfDay, getDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { CalendarClock, SlidersHorizontal, X } from "lucide-react";
import { UiSelect } from "../../../Components/ui/Select";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { useIdioma } from "../../../lib/useIdioma";
import { t } from "../../../lib/t";
import {
  eliminarExcepcionPorFecha,
  guardarExcepcionHorario,
  listarDisponibilidad,
} from "../../../services/ajustesService";
import { sanitizeUserFacingError } from "../../../lib/formLimits";

const inputClass =
  "min-h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white accent-slate-900";

const btnPrimario =
  "inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-[length:var(--text-body)] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

const btnSecundario =
  "inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

const TIPOS_FILTRO = [
  { value: "todos", label: "Todos" },
  { value: "visitas", label: "Visitas" },
  { value: "voluntariado", label: "Voluntariado" },
];

function isoDate(d) {
  return format(d, "yyyy-MM-dd");
}

/** Evita el desfase UTC de parseISO("yyyy-MM-dd") en Costa Rica. */
function fechaLocalDesdeIso(fecha) {
  const [y, m, d] = String(fecha || "")
    .slice(0, 10)
    .split("-")
    .map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function normalizarHoraUi(valor) {
  const raw = String(valor ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw.slice(0, 5);
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

function esMismoHorarioBase(horaInicio, horaFin, reglas) {
  const apertura = normalizarHoraUi(reglas?.horaApertura || "08:00");
  const cierre = normalizarHoraUi(reglas?.horaCierre || "17:00");
  return (
    normalizarHoraUi(horaInicio) === apertura &&
    normalizarHoraUi(horaFin) === cierre
  );
}

function esFinDeSemanaDate(d) {
  const day = getDay(d);
  return day === 0 || day === 6;
}

function tiposAGuardar(filtroTipo) {
  if (filtroTipo === "todos") return ["visitas", "voluntariado"];
  return [filtroTipo];
}

/**
 * Calendario grande: lun–vie 8–5 por defecto.
 * SuperAdmin marca excepciones (cerrado / horario especial).
 * Sábados y domingos no aparecen.
 */
export function HorariosCalendario({ onMessage, onError }) {
  const { idioma } = useIdioma();
  const localeFecha = idioma === "en" ? enUS : es;
  const hoy = useMemo(() => startOfDay(new Date()), []);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [reglas, setReglas] = useState({
    horaApertura: "08:00",
    horaCierre: "17:00",
    mensaje:
      "Lunes a viernes de 8:00 a. m. a 5:00 p. m. Sábados y domingos no están disponibles.",
  });
  const [excepciones, setExcepciones] = useState([]);
  const [fechaSel, setFechaSel] = useState(null);
  const [modo, setModo] = useState("normal");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("17:00");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorHoras, setErrorHoras] = useState("");

  const tGuardando = useTraducir("Guardando…");
  const tGuardarDia = useTraducir("Guardar día");
  const tCancelar = useTraducir("Cancelar");
  const tElegirDia = useTraducir("Elegí un día hábil en el calendario");
  const tCerrado = useTraducir("Cerrado / no disponible");
  const tMensajeReglas = useTraducir(reglas.mensaje || "");

  const tiposFiltroUi = TIPOS_FILTRO.map((op) => ({ ...op, label: t(op.label) }));

  /** Una entrada por fecha (si hay varias por tipo, prioriza cerrado > especial). */
  const excepcionPorFecha = useMemo(() => {
    const map = new Map();
    for (const e of excepciones) {
      const prev = map.get(e.fecha);
      if (!prev) {
        map.set(e.fecha, e);
        continue;
      }
      if (!e.disponible) map.set(e.fecha, e);
      else if (prev.disponible && e.disponible) map.set(e.fecha, e);
    }
    return map;
  }, [excepciones]);

  const fechasCerradas = useMemo(
    () =>
      [...excepcionPorFecha.values()]
        .filter((e) => !e.disponible)
        .map((e) => fechaLocalDesdeIso(e.fecha))
        .filter(Boolean),
    [excepcionPorFecha],
  );

  const fechasEspeciales = useMemo(
    () =>
      [...excepcionPorFecha.values()]
        .filter(
          (e) =>
            e.disponible &&
            !esMismoHorarioBase(e.horaInicio, e.horaFin, reglas),
        )
        .map((e) => fechaLocalDesdeIso(e.fecha))
        .filter(Boolean),
    [excepcionPorFecha, reglas],
  );

  const cargar = async () => {
    setCargando(true);
    try {
      const tipoApi = filtroTipo === "todos" ? undefined : filtroTipo;
      const data = await listarDisponibilidad(tipoApi);
      setReglas(data.reglas || reglas);
      setExcepciones(data.excepciones || []);
    } catch (err) {
      onError?.(sanitizeUserFacingError(err?.message || "No se pudo cargar el horario."));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo]);

  useEffect(() => {
    if (!fechaSel) return;
    setErrorHoras("");
    const key = isoDate(fechaSel);
    const exc = excepcionPorFecha.get(key);
    const apertura = normalizarHoraUi(reglas.horaApertura || "08:00");
    const cierre = normalizarHoraUi(reglas.horaCierre || "17:00");
    if (!exc) {
      setModo("normal");
      setHoraInicio(apertura);
      setHoraFin(cierre);
      return;
    }
    if (!exc.disponible) {
      setModo("cerrado");
      setHoraInicio(apertura);
      setHoraFin(cierre);
      return;
    }
    // 08:00–17:00 guardado como “especial” es en la práctica horario normal
    if (esMismoHorarioBase(exc.horaInicio, exc.horaFin, reglas)) {
      setModo("normal");
      setHoraInicio(apertura);
      setHoraFin(cierre);
      return;
    }
    setModo("especial");
    setHoraInicio(normalizarHoraUi(exc.horaInicio) || apertura);
    setHoraFin(normalizarHoraUi(exc.horaFin) || cierre);
  }, [fechaSel, excepcionPorFecha, reglas]);

  const seleccionarDia = (day) => {
    if (!day) {
      setFechaSel(null);
      return;
    }
    if (esFinDeSemanaDate(day)) {
      onError?.(t("Sábados y domingos no son laborables. No se pueden configurar."));
      return;
    }
    onError?.("");
    setErrorHoras("");
    setFechaSel(day);
  };

  const guardar = async () => {
    if (!fechaSel) return;
    const fecha = isoDate(fechaSel);
    if (esFinDeSemanaDate(fechaSel)) {
      onError?.(t("Sábados y domingos no son laborables."));
      return;
    }

    const tipos = tiposAGuardar(filtroTipo);
    setGuardando(true);
    onError?.("");
    setErrorHoras("");
    try {
      if (modo === "normal") {
        for (const tipoGuarda of tipos) {
          await eliminarExcepcionPorFecha(tipoGuarda, fecha);
        }
        onMessage?.(
          t(
            filtroTipo === "todos"
              ? "Día restaurado al horario normal (visitas y voluntariado)."
              : "Día restaurado al horario normal (8:00 a. m. – 5:00 p. m.).",
          ),
        );
      } else if (modo === "cerrado") {
        for (const tipoGuarda of tipos) {
          await guardarExcepcionHorario({
            tipo: tipoGuarda,
            fecha,
            disponible: false,
            horaInicio: "",
            horaFin: "",
            nota: "",
          });
        }
        onMessage?.(
          t(
            filtroTipo === "todos"
              ? "Día marcado como no disponible para visitas y voluntariado."
              : "Día marcado como no disponible.",
          ),
        );
      } else {
        const desde = normalizarHoraUi(horaInicio);
        const hasta = normalizarHoraUi(horaFin);
        const apertura = normalizarHoraUi(reglas.horaApertura || "08:00");
        const cierre = normalizarHoraUi(reglas.horaCierre || "17:00");
        if (!desde || !hasta || hasta <= desde) {
          setErrorHoras(t("La hora de fin debe ser posterior a la de inicio."));
          setGuardando(false);
          return;
        }
        if (desde < apertura || hasta > cierre) {
          setErrorHoras(
            t(`El horario especial debe estar entre ${apertura} y ${cierre}.`),
          );
          setGuardando(false);
          return;
        }
        if (esMismoHorarioBase(desde, hasta, reglas)) {
          setErrorHoras(
            t(
              `Cambiá las horas (ej. 13:00 – 16:00). ${apertura} – ${cierre} es el horario normal.`,
            ),
          );
          setGuardando(false);
          return;
        }
        for (const tipoGuarda of tipos) {
          await guardarExcepcionHorario({
            tipo: tipoGuarda,
            fecha,
            disponible: true,
            horaInicio: desde,
            horaFin: hasta,
            nota: "",
          });
        }
        onMessage?.(t(`Horario especial guardado: ${desde} – ${hasta}.`));
      }
      await cargar();
    } catch (err) {
      const msg = sanitizeUserFacingError(err?.message || "No se pudo guardar.");
      if (modo === "especial") setErrorHoras(msg);
      else onError?.(msg);
    } finally {
      setGuardando(false);
    }
  };

  const etiquetaFecha = fechaSel
    ? format(
        fechaSel,
        idioma === "en" ? "EEEE, MMMM d, yyyy" : "EEEE d 'de' MMMM yyyy",
        { locale: localeFecha },
      )
    : tElegirDia;

  const resumenDia = (() => {
    if (!fechaSel) return null;
    const key = isoDate(fechaSel);
    const exc = excepcionPorFecha.get(key);
    const apertura = normalizarHoraUi(reglas.horaApertura || "08:00");
    const cierre = normalizarHoraUi(reglas.horaCierre || "17:00");
    if (!exc || (exc.disponible && esMismoHorarioBase(exc.horaInicio, exc.horaFin, reglas))) {
      return `${t("Horario normal")}: ${apertura} – ${cierre}`;
    }
    if (!exc.disponible) return tCerrado;
    return `${t("Horario especial")}: ${exc.horaInicio} – ${exc.horaFin}`;
  })();

  const opcionesModo = [
    {
      id: "normal",
      label: `${t("Horario normal")} (${reglas.horaApertura || "08:00"} – ${reglas.horaCierre || "17:00"})`,
    },
    { id: "cerrado", label: t("Cerrado / no disponible (feriado)") },
    {
      id: "especial",
      label: t("Horario especial (dentro de 8:00–17:00)"),
    },
  ];

  return (
    <section className="overflow-visible rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-slate-700" />
          <h2 className="text-[length:var(--text-subtitle)] font-bold text-slate-950">
            <ST>Calendario de disponibilidad</ST>
          </h2>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-2 text-[length:var(--text-subtitle)] font-semibold text-slate-700">
            <SlidersHorizontal className="size-5" aria-hidden />
            <ST>Tipo</ST>
          </span>
          <div className="w-full min-w-[14rem] sm:w-[20rem]">
            <UiSelect
              ariaLabel={t("Tipo de disponibilidad")}
              value={filtroTipo}
              onChange={(v) => {
                setFiltroTipo(v);
                setFechaSel(null);
              }}
              options={tiposFiltroUi}
              className="horarios-filtro-tipo"
            />
          </div>
          {filtroTipo !== "todos" ? (
            <button
              type="button"
              onClick={() => {
                setFiltroTipo("todos");
                setFechaSel(null);
              }}
              className="inline-flex min-h-[var(--control-height)] items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[length:var(--text-body)] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X className="size-3.5" aria-hidden />
              <ST>Limpiar</ST>
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-b border-slate-100 px-4 pt-4 sm:px-6">
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[length:var(--text-body)] text-slate-800">
          <p className="font-semibold text-slate-900">
            <ST>Horario base</ST>
          </p>
          <p className="mt-1 text-slate-600">{tMensajeReglas}</p>
        </div>
      </div>

      <div className="grid gap-6 px-4 pb-6 pt-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)] sm:px-6">
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-5">
          {cargando ? (
            <p className="p-4 text-[length:var(--text-body)] text-slate-500">
              <ST>Cargando calendario…</ST>
            </p>
          ) : (
            <DayPicker
              mode="single"
              locale={localeFecha}
              selected={fechaSel}
              onSelect={seleccionarDia}
              defaultMonth={fechaSel || hoy}
              numberOfMonths={1}
              disabled={[{ before: hoy }]}
              hidden={{ dayOfWeek: [0, 6] }}
              modifiers={{
                cerrado: fechasCerradas,
                especial: fechasEspeciales,
              }}
              modifiersClassNames={{
                cerrado: "rdp-day-cerrado",
                especial: "rdp-day-especial",
              }}
              className="calendar-horarios-admin mx-auto"
              style={{
                "--rdp-accent-color": "#0f172a",
                "--rdp-accent-background-color": "#e2e8f0",
                "--rdp-today-color": "#0f172a",
                "--rdp-selected-border": "2px solid #0f172a",
              }}
            />
          )}
          <div className="mt-4 flex flex-wrap gap-4 px-1 text-[length:var(--text-body)] text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded-full bg-slate-400" /> <ST>Cerrado / feriado</ST>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded-full bg-slate-600" /> <ST>Horario especial</ST>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded-full bg-slate-900" /> <ST>Seleccionado</ST>
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-[length:var(--text-subtitle)] font-bold capitalize text-slate-950">
            {etiquetaFecha}
          </h3>
          {resumenDia ? (
            <p className="mt-1 text-[length:var(--text-body)] text-slate-500">{resumenDia}</p>
          ) : null}

          {!fechaSel ? (
            <p className="mt-3 text-[length:var(--text-body)] text-slate-500">
              <ST>Tocá un lunes a viernes en el calendario para ajustar ese día.</ST>
            </p>
          ) : (
            <div className="mt-4 grid gap-4">
              <fieldset className="grid gap-2">
                <legend className="text-[length:var(--text-body)] font-semibold text-slate-700">
                  <ST>Qué aplica ese día</ST>
                </legend>
                {opcionesModo.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex min-h-[var(--control-height)] cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-3 text-[length:var(--text-body)] text-slate-800"
                  >
                    <input
                      type="radio"
                      name="modo-horario"
                      checked={modo === opt.id}
                      onChange={() => {
                        setErrorHoras("");
                        setModo(opt.id);
                        if (opt.id === "especial" && esMismoHorarioBase(horaInicio, horaFin, reglas)) {
                          setHoraInicio("13:00");
                          setHoraFin("16:00");
                        }
                        if (opt.id === "normal") {
                          setHoraInicio(normalizarHoraUi(reglas.horaApertura || "08:00"));
                          setHoraFin(normalizarHoraUi(reglas.horaCierre || "17:00"));
                        }
                      }}
                      className="size-4 accent-slate-900"
                    />
                    {opt.label}
                  </label>
                ))}
              </fieldset>

              {modo === "especial" ? (
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-[length:var(--text-body)] font-medium text-slate-700">
                      <ST>Desde</ST>
                      <input
                        type="time"
                        min={reglas.horaApertura || "08:00"}
                        max={reglas.horaCierre || "17:00"}
                        step={900}
                        className={inputClass}
                        value={horaInicio}
                        onChange={(e) => {
                          setErrorHoras("");
                          setHoraInicio(e.target.value);
                        }}
                      />
                    </label>
                    <label className="grid gap-1 text-[length:var(--text-body)] font-medium text-slate-700">
                      <ST>Hasta</ST>
                      <input
                        type="time"
                        min={reglas.horaApertura || "08:00"}
                        max={reglas.horaCierre || "17:00"}
                        step={900}
                        className={inputClass}
                        value={horaFin}
                        onChange={(e) => {
                          setErrorHoras("");
                          setHoraFin(e.target.value);
                        }}
                      />
                    </label>
                  </div>
                  {errorHoras ? (
                    <p className="text-[length:var(--text-body)] text-red-600" role="alert">
                      <ST>{errorHoras}</ST>
                    </p>
                  ) : (
                    <p className="text-[length:var(--text-body)] text-slate-500">
                      <ST>Tiene que ser distinto al horario normal</ST>
                      {" ("}
                      {normalizarHoraUi(reglas.horaApertura || "08:00")} –{" "}
                      {normalizarHoraUi(reglas.horaCierre || "17:00")}
                      ).
                    </p>
                  )}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnPrimario}
                  disabled={guardando}
                  onClick={guardar}
                >
                  {guardando ? tGuardando : tGuardarDia}
                </button>
                <button
                  type="button"
                  className={btnSecundario}
                  disabled={guardando || !fechaSel}
                  onClick={() => setFechaSel(null)}
                >
                  {tCancelar}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .horarios-filtro-tipo .ui-select__trigger {
          font-weight: 600;
          padding-left: 1.1rem;
          padding-right: 1.1rem;
        }
        .horarios-filtro-tipo .ui-select__value {
          font-size: var(--text-body);
        }
        .calendar-horarios-admin {
          --rdp-accent-color: #0f172a;
          --rdp-accent-background-color: #e2e8f0;
          --rdp-range_start-date-background-color: #0f172a;
          --rdp-selected-border: 2px solid #0f172a;
          --rdp-today-color: #0f172a;
          --rdp-day-height: 3rem;
          --rdp-day-width: 3rem;
          font-size: var(--text-body);
          color: #0f172a;
          max-width: 28rem;
        }
        .calendar-horarios-admin .rdp-months {
          justify-content: center;
          gap: 0;
        }
        .calendar-horarios-admin .rdp-month_caption,
        .calendar-horarios-admin .rdp-caption_label {
          color: #0f172a !important;
          font-size: var(--text-subtitle);
          font-weight: 700;
        }
        .calendar-horarios-admin .rdp-button_previous,
        .calendar-horarios-admin .rdp-button_next,
        .calendar-horarios-admin .rdp-chevron {
          color: #475569 !important;
          fill: #475569 !important;
        }
        .calendar-horarios-admin .rdp-selected .rdp-day_button,
        .calendar-horarios-admin [aria-selected="true"] .rdp-day_button,
        .calendar-horarios-admin .rdp-day_button[aria-selected="true"] {
          background-color: #0f172a !important;
          border-color: #0f172a !important;
          color: #fff !important;
        }
        .calendar-horarios-admin .rdp-today:not([aria-selected="true"]) .rdp-day_button {
          color: #0f172a !important;
          font-weight: 700;
        }
        .calendar-horarios-admin .rdp-day-cerrado:not([aria-selected="true"]) .rdp-day_button,
        .calendar-horarios-admin .rdp-day-cerrado:not(.rdp-selected) {
          background: #94a3b8 !important;
          color: #0f172a !important;
          border-radius: 9999px;
        }
        .calendar-horarios-admin .rdp-day-especial:not([aria-selected="true"]) .rdp-day_button,
        .calendar-horarios-admin .rdp-day-especial:not(.rdp-selected) {
          background: #64748b !important;
          color: #fff !important;
          border-radius: 9999px;
        }
      `}</style>
    </section>
  );
}
