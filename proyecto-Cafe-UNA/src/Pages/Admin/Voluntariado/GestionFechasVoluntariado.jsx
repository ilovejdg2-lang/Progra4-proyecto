import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Info,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { useIdioma } from "../../../lib/useIdioma";
import {
  actualizarEstadoFechaAdmin,
  eliminarFechaAdmin,
  habilitarFechaAdmin,
  obtenerTodasFechasAdmin,
} from "../../../services/voluntariadoFechasService";

function toIsoString(date) {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

function parseIsoLocal(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = isoStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function GestionFechasVoluntariado({ esSuperAdmin = false }) {
  const { idioma } = useIdioma();
  const locale = idioma === "en" ? enUS : es;
  const hoy = useMemo(() => startOfDay(new Date()), []);

  const [fechas, setFechas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const [mesActual, setMesActual] = useState(hoy);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const [cupoMaximo, setCupoMaximo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const tTitulo = useTraducir("Gestión de fechas de voluntariado");
  const tSub = useTraducir(
    "Defina los días del calendario en los que se recibirán voluntarios. Los días habilitados se identifican con un círculo negro."
  );

  const cargarFechas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerTodasFechasAdmin();
      setFechas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar fechas de voluntariado:", err);
      setError("No se pudieron cargar las fechas disponibles. Intente nuevamente.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFechas();
  }, [cargarFechas]);

  // Mapa de fechas habilitadas (ISO string -> boolean)
  const fechasHabilitadasMap = useMemo(() => {
    const map = new Map();
    for (const f of fechas) {
      const iso = String(f.Fecha || f.fecha || "").slice(0, 10);
      if (iso && (f.Habilitada || f.habilitada)) {
        map.set(iso, f);
      }
    }
    return map;
  }, [fechas]);

  // Lista de objetos Date habilitados para el modifier de react-day-picker
  const fechasHabilitadasDates = useMemo(() => {
    const list = [];
    for (const [iso] of fechasHabilitadasMap) {
      const d = parseIsoLocal(iso);
      if (d) list.push(d);
    }
    return list;
  }, [fechasHabilitadasMap]);

  // Fecha seleccionada actual en ISO
  const isoSeleccionada = useMemo(
    () => (fechaSeleccionada ? toIsoString(fechaSeleccionada) : ""),
    [fechaSeleccionada]
  );

  const registroSeleccionado = useMemo(() => {
    if (!isoSeleccionada) return null;
    return (
      fechas.find(
        (f) => String(f.Fecha || f.fecha || "").slice(0, 10) === isoSeleccionada
      ) || null
    );
  }, [fechas, isoSeleccionada]);

  const estaHabilitadaSeleccionada = useMemo(() => {
    if (!registroSeleccionado) return false;
    return Boolean(
      registroSeleccionado.Habilitada ?? registroSeleccionado.habilitada
    );
  }, [registroSeleccionado]);

  // Sincronizar campos de edición cuando cambia la fecha seleccionada
  useEffect(() => {
    if (registroSeleccionado) {
      setCupoMaximo(
        registroSeleccionado.CupoMaximo ?? registroSeleccionado.cupoMaximo ?? ""
      );
      setObservaciones(
        registroSeleccionado.Observaciones ??
          registroSeleccionado.observaciones ??
          ""
      );
    } else {
      setCupoMaximo("");
      setObservaciones("");
    }
    setMensajeExito(null);
  }, [registroSeleccionado]);

  const handleSelectFecha = (date) => {
    setFechaSeleccionada(date || null);
    setError(null);
    setMensajeExito(null);
  };

  const handleToggleEstado = async () => {
    if (!fechaSeleccionada) return;
    const iso = toIsoString(fechaSeleccionada);
    const nuevoEstado = !estaHabilitadaSeleccionada;

    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    try {
      await actualizarEstadoFechaAdmin(iso, nuevoEstado, {
        cupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
        observaciones,
      });

      setFechas((prev) => {
        const existe = prev.some(
          (f) => String(f.Fecha || f.fecha || "").slice(0, 10) === iso
        );
        if (existe) {
          return prev.map((f) =>
            String(f.Fecha || f.fecha || "").slice(0, 10) === iso
              ? {
                  ...f,
                  Habilitada: nuevoEstado,
                  habilitada: nuevoEstado,
                  CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
                  Observaciones: observaciones,
                }
              : f
          );
        }
        return [
          ...prev,
          {
            Fecha: iso,
            fecha: iso,
            Habilitada: nuevoEstado,
            habilitada: nuevoEstado,
            CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
            Observaciones: observaciones,
          },
        ];
      });

      setMensajeExito(
        nuevoEstado
          ? `Fecha ${iso} habilitada para recibir voluntarios.`
          : `Fecha ${iso} deshabilitada.`
      );
    } catch (err) {
      console.error("Error al actualizar estado de la fecha:", err);
      setError(
        err?.response?.data?.message ||
          "Error al actualizar la disponibilidad de la fecha."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!fechaSeleccionada) return;
    const iso = toIsoString(fechaSeleccionada);

    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    try {
      await habilitarFechaAdmin(iso, {
        cupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
        observaciones,
      });

      setFechas((prev) => {
        const existe = prev.some(
          (f) => String(f.Fecha || f.fecha || "").slice(0, 10) === iso
        );
        if (existe) {
          return prev.map((f) =>
            String(f.Fecha || f.fecha || "").slice(0, 10) === iso
              ? {
                  ...f,
                  Habilitada: true,
                  habilitada: true,
                  CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
                  Observaciones: observaciones,
                }
              : f
          );
        }
        return [
          ...prev,
          {
            Fecha: iso,
            fecha: iso,
            Habilitada: true,
            habilitada: true,
            CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
            Observaciones: observaciones,
          },
        ];
      });

      setMensajeExito(`Fecha ${iso} guardada y habilitada correctamente.`);
    } catch (err) {
      console.error("Error al guardar fecha:", err);
      setError(
        err?.response?.data?.message || "Error al guardar los cambios de la fecha."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarFecha = async () => {
    if (!fechaSeleccionada || !registroSeleccionado) return;
    const iso = toIsoString(fechaSeleccionada);

    const confirmar = window.confirm(
      `¿Desea eliminar la configuración de la fecha ${iso}?`
    );
    if (!confirmar) return;

    setGuardando(true);
    setError(null);
    try {
      await eliminarFechaAdmin(iso);
      setFechas((prev) =>
        prev.filter((f) => String(f.Fecha || f.fecha || "").slice(0, 10) !== iso)
      );
      setMensajeExito(`Fecha ${iso} eliminada del calendario.`);
      setCupoMaximo("");
      setObservaciones("");
    } catch (err) {
      console.error("Error al eliminar fecha:", err);
      setError(
        err?.response?.data?.message || "Error al eliminar el registro de la fecha."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Cantidad de fechas habilitadas en el mes que se está viendo
  const totalHabilitadasMes = useMemo(() => {
    const mesIso = format(mesActual, "yyyy-MM");
    return Array.from(fechasHabilitadasMap.keys()).filter((iso) =>
      iso.startsWith(mesIso)
    ).length;
  }, [fechasHabilitadasMap, mesActual]);

  const esFechaPasada = fechaSeleccionada
    ? isBefore(startOfDay(fechaSeleccionada), hoy)
    : false;

  return (
    <div className="space-y-6">
      {/* Encabezado de la sección */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-6 text-slate-900" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                <ST>{tTitulo}</ST>
              </h1>
            </div>
            <p className="mt-1 max-w-3xl text-slate-600">
              <ST>{tSub}</ST>
            </p>
          </div>

          <button
            type="button"
            onClick={cargarFechas}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 self-start"
          >
            <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} />
            <ST>Actualizar calendario</ST>
          </button>
        </div>

        {/* Resumen rápido */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 border border-slate-100">
          <span className="font-semibold text-slate-900">
            <ST>Resumen:</ST>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-3.5 rounded-full border-2 border-slate-950 bg-white" />
            <span>
              <strong>{totalHabilitadasMes}</strong>{" "}
              <ST>días habilitados en</ST>{" "}
              <span className="capitalize">{format(mesActual, "MMMM yyyy", { locale })}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-500">
            <Info className="size-4" />
            <span>
              <ST>Haga clic en cualquier día para habilitarlo o deshabilitarlo.</ST>
            </span>
          </div>
        </div>
      </div>

      {/* Alertas de error o éxito */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 flex items-center gap-2">
          <XCircle className="size-5 shrink-0" />
          <span><ST>{error}</ST></span>
        </div>
      )}

      {mensajeExito && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 flex items-center gap-2">
          <CheckCircle2 className="size-5 shrink-0" />
          <span><ST>{mensajeExito}</ST></span>
        </div>
      )}

      {/* Contenedor principal: Calendario + Panel de Configuración */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.95fr)]">
        {/* Calendario con react-day-picker / shadcn */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="size-5 text-slate-700" />
              <ST>Calendario mensual de disponibilidad</ST>
            </h2>
            <span className="text-xs text-slate-500 font-medium capitalize">
              {format(mesActual, "MMMM yyyy", { locale })}
            </span>
          </div>

          <div className="w-full flex justify-center py-2">
            <Calendar
              mode="single"
              month={mesActual}
              onMonthChange={setMesActual}
              selected={fechaSeleccionada}
              onSelect={handleSelectFecha}
              locale={locale}
              modifiers={{
                habilitado: fechasHabilitadasDates,
              }}
              modifiersClassNames={{
                habilitado: "rdp-day-habilitado",
              }}
              captionLayout="dropdown"
            />
          </div>

          {/* Leyenda visual conceptual solicitada */}
          <div className="w-full mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full border-2 border-slate-950 bg-white font-bold text-slate-950 text-[11px]">
                15
              </span>
              <span><ST>Día habilitado (Círculo negro)</ST></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center font-medium text-slate-700 text-[11px]">
                15
              </span>
              <span><ST>Día no habilitado (Normal)</ST></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-950 font-bold text-white text-[11px]">
                15
              </span>
              <span><ST>Día seleccionado</ST></span>
            </div>
          </div>
        </div>

        {/* Panel de administración del día seleccionado */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            <ST>Detalles del día seleccionado</ST>
          </h3>

          {fechaSeleccionada ? (
            <div className="space-y-5 flex-1 flex flex-col">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  <ST>Fecha seleccionada</ST>
                </span>
                <p className="text-lg font-bold text-slate-950 capitalize mt-0.5">
                  {format(fechaSeleccionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale })}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ISO: {isoSeleccionada}</p>
              </div>

              {/* Indicador de estado */}
              <div
                className={`rounded-xl border p-4 flex items-center justify-between ${
                  estaHabilitadaSeleccionada
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {estaHabilitadaSeleccionada ? (
                    <CalendarCheck2 className="size-6 text-white" />
                  ) : (
                    <CalendarX2 className="size-6 text-slate-400" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {estaHabilitadaSeleccionada
                        ? <ST>Fecha Habilitada</ST>
                        : <ST>Fecha No Habilitada</ST>}
                    </p>
                    <p
                      className={`text-xs ${
                        estaHabilitadaSeleccionada ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {estaHabilitadaSeleccionada
                        ? <ST>Los usuarios pueden elegir esta fecha</ST>
                        : <ST>Esta fecha está bloqueada para los usuarios</ST>}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleEstado}
                  disabled={guardando || esFechaPasada}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition ${
                    estaHabilitadaSeleccionada
                      ? "bg-white text-slate-950 hover:bg-slate-100"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {guardando
                    ? "..."
                    : estaHabilitadaSeleccionada
                    ? <ST>Deshabilitar</ST>
                    : <ST>Habilitar ahora</ST>}
                </button>
              </div>

              {esFechaPasada && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <ST>Esta fecha ya pasó. No se puede modificar su disponibilidad.</ST>
                </p>
              )}

              {/* Configuración opcional */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    <ST>Cupo máximo de voluntarios (opcional):</ST>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    placeholder="Ej. 20"
                    value={cupoMaximo}
                    onChange={(e) => setCupoMaximo(e.target.value)}
                    disabled={guardando || esFechaPasada}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    <ST>Observaciones internas / Nota (opcional):</ST>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Actividad especial de reforestación en vivero"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    disabled={guardando || esFechaPasada}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition resize-none"
                  />
                </div>
              </div>

              {/* Acciones de guardado */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGuardarCambios}
                  disabled={guardando || esFechaPasada}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Save className="size-4" />
                  <span>
                    {guardando ? <ST>Guardando...</ST> : <ST>Guardar cambios de la fecha</ST>}
                  </span>
                </button>

                {registroSeleccionado && esSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleEliminarFecha}
                    disabled={guardando}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    <span><ST>Eliminar registro</ST></span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <CalendarDays className="size-12 stroke-[1.2] text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">
                <ST>Seleccione una fecha del calendario</ST>
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                <ST>Haga clic sobre cualquier día para ver su estado actual, habilitarlo o modificar sus detalles.</ST>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionFechasVoluntariado;
