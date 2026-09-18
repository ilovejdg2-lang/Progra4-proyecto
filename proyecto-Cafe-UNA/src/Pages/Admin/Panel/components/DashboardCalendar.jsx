import { useEffect, useMemo, useState } from "react";
import { ST } from "../../../../Components/T/ST";
import { Calendar } from "../../../../Components/ui/calendar";
import { obtenerTodasFechasAdmin, obtenerFechasDisponibles } from "../../../../services/voluntariadoFechasService";
import { obtenerDisponibilidadVisitasAdmin, obtenerDisponibilidadVisitasPublica } from "../../../../services/visitasService";

function claveFecha(valor) {
  if (!valor) return "";
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    const d = String(valor.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const texto = String(valor).trim();
  const iso = texto.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const parsed = new Date(valor);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function estaHabilitada(item) {
  const raw = item?.habilitada ?? item?.Habilitada;
  if (raw === false || raw === "false" || raw === 0) return false;
  return true;
}

function mapearVoluntariado(raw) {
  if (!estaHabilitada(raw)) return null;
  const fecha = claveFecha(raw?.fecha ?? raw?.Fecha);
  if (!fecha) return null;
  const tipo = String(raw?.tipoVoluntariado ?? raw?.TipoVoluntariado ?? "Voluntariado").trim();
  const horarios = Array.isArray(raw?.horarios)
    ? raw.horarios
    : Array.isArray(raw?.Horarios)
      ? raw.Horarios
      : [];
  const horas = horarios.map((h) => String(h || "").trim()).filter(Boolean);
  return {
    id: `vol-${raw?.id ?? raw?.Id ?? `${fecha}-${tipo}`}`,
    fecha,
    etiqueta: tipo ? `Voluntariado · ${tipo}` : "Voluntariado",
    detalle: horas.length ? horas.join(" · ") : "",
  };
}

function mapearVisita(raw) {
  if (!estaHabilitada(raw)) return null;
  const fecha = claveFecha(raw?.fecha ?? raw?.Fecha);
  if (!fecha) return null;
  const inicio = String(raw?.horaInicio ?? raw?.HoraInicio ?? "").trim();
  const fin = String(raw?.horaFin ?? raw?.HoraFin ?? "").trim();
  const horario = [inicio, fin].filter(Boolean).join(" – ");
  return {
    id: `vis-${raw?.id ?? raw?.Id ?? `${fecha}-${inicio}`}`,
    fecha,
    etiqueta: "Visita grupal",
    detalle: horario,
  };
}

async function cargarVoluntariado() {
  try {
    return await obtenerTodasFechasAdmin();
  } catch {
    return obtenerFechasDisponibles();
  }
}

async function cargarVisitas() {
  try {
    return await obtenerDisponibilidadVisitasAdmin();
  } catch {
    return obtenerDisponibilidadVisitasPublica();
  }
}

export function DashboardCalendar({ fecha }) {
  const hoy = useMemo(() => {
    const d = fecha instanceof Date ? fecha : new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, [fecha]);
  const [mes, setMes] = useState(hoy);
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    Promise.all([cargarVoluntariado().catch(() => []), cargarVisitas().catch(() => [])])
      .then(([voluntariado, visitas]) => {
        if (!activo) return;
        const lista = [
          ...(Array.isArray(voluntariado) ? voluntariado : []).map(mapearVoluntariado),
          ...(Array.isArray(visitas) ? visitas : []).map(mapearVisita),
        ].filter(Boolean);
        setEventos(lista);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const claveSeleccion = claveFecha(diaSeleccionado);
  const delDia = useMemo(
    () => eventos.filter((item) => item.fecha === claveSeleccion),
    [eventos, claveSeleccion],
  );
  const diasConActividad = useMemo(() => {
    const vistos = new Set();
    const fechas = [];
    for (const item of eventos) {
      if (vistos.has(item.fecha)) continue;
      vistos.add(item.fecha);
      const [y, m, d] = item.fecha.split("-").map(Number);
      fechas.push(new Date(y, m - 1, d));
    }
    return fechas;
  }, [eventos]);

  const esHoy = claveFecha(diaSeleccionado) === claveFecha(hoy);
  const etiquetaDia = diaSeleccionado.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <h2 className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-50">
        {mes.toLocaleDateString("es-CR", { month: "long", year: "numeric" })}
      </h2>
      <div className="mt-2 overflow-x-auto">
        <Calendar
          mode="single"
          month={mes}
          onMonthChange={setMes}
          selected={diaSeleccionado}
          onSelect={(dia) => {
            if (dia) setDiaSeleccionado(dia);
          }}
          captionLayout="label"
          modifiers={{ conActividad: diasConActividad }}
          modifiersClassNames={{ conActividad: "admin-dashboard-cal-actividad" }}
          className="mx-auto w-full max-w-[280px]"
        />
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className={`text-xs font-semibold ${esHoy ? "text-[#a33b3b]" : "text-slate-700 dark:text-slate-200"}`}>
          {esHoy ? (
            <>
              <ST>Hoy</ST>, {etiquetaDia}
            </>
          ) : (
            etiquetaDia
          )}
        </p>
        {cargando ? (
          <p className="mt-2 text-xs text-slate-400"><ST>Cargando actividades...</ST></p>
        ) : delDia.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            <ST>No hay actividades programadas.</ST>
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {delDia.map((item) => (
              <li key={item.id} className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-800 dark:text-slate-100">{item.etiqueta}</p>
                {item.detalle ? <p className="text-slate-400">{item.detalle}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
