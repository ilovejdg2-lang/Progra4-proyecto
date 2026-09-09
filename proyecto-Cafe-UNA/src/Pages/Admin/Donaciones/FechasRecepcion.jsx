import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock,
  Info,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminLayout } from "../layouts/AdminLayout";
import { ST } from "../../../Components/T/ST";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useTraducir } from "../../../hooks/useTraducir";
import { HORARIOS_RECEPCION_DONACION } from "../../../lib/donacionFechasRecepcion";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { useIdioma } from "../../../lib/useIdioma";
import {
  actualizarFechaRecepcionAdmin,
  eliminarFechaRecepcionAdmin,
  habilitarFechaRecepcionAdmin,
  obtenerFechasRecepcionAdmin,
} from "../../../services/donacionesService";
import { getActiveSessionUser } from "../../../services/sessionService";

function toIsoString(date) {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

function parseIsoLocal(iso) {
  if (!iso) return null;
  const fecha = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export default function AdminFechasRecepcionDonacion() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer =
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
    tienePermiso(roles, "ver_solicitudes_donacion");
  const puedeEditar = tienePermiso(roles, "administrar_solicitudes_donaciones");
  const { idioma } = useIdioma();
  const locale = idioma === "en" ? enUS : es;
  const tTitulo = useTraducir("Fechas de recepción de donaciones");
  const tSub = useTraducir(
    "Configure los días y horarios en los que el centro de acopio puede recibir donaciones entregadas personalmente. La recolección se coordina de forma individual y no usa este calendario.",
  );

  const [fechas, setFechas] = useState([]);
  const [status, setStatus] = useState("idle");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [horarios, setHorarios] = useState([]);
  const [observaciones, setObservaciones] = useState("");
  const [nuevoHorarioPersonalizado, setNuevoHorarioPersonalizado] = useState("");

  const hoy = startOfDay(new Date());
  const { showLoading, loadingMessage } = useAdminPageGate(
    "/admin/donaciones/fechas-recepcion",
    status !== "idle",
  );

  const cargarFechas = useCallback(async () => {
    if (!puedeVer) {
      setStatus("success");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      setFechas(await obtenerFechasRecepcionAdmin());
      setStatus("success");
    } catch (err) {
      setFechas([]);
      setStatus("error");
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al cargar las fechas de recepción.",
      );
    } finally {
      setCargando(false);
    }
  }, [puedeVer]);

  useEffect(() => {
    cargarFechas();
  }, [cargarFechas]);

  const fechasHabilitadasMap = useMemo(() => {
    const map = new Map();
    for (const f of fechas) {
      const iso = String(f.Fecha || f.fecha || "").slice(0, 10);
      const hab = Boolean(f.Habilitada ?? f.habilitada);
      if (iso && hab) map.set(iso, f);
    }
    return map;
  }, [fechas]);

  const fechasHabilitadasDates = useMemo(
    () =>
      Array.from(fechasHabilitadasMap.keys())
        .map(parseIsoLocal)
        .filter(Boolean),
    [fechasHabilitadasMap],
  );

  const isoSeleccionada = useMemo(
    () => (fechaSeleccionada ? toIsoString(fechaSeleccionada) : ""),
    [fechaSeleccionada],
  );

  const registroSeleccionado = useMemo(() => {
    if (!isoSeleccionada) return null;
    return (
      fechas.find(
        (f) => String(f.Fecha || f.fecha || "").slice(0, 10) === isoSeleccionada,
      ) || null
    );
  }, [fechas, isoSeleccionada]);

  const estaHabilitadaSeleccionada = useMemo(() => {
    if (!registroSeleccionado) return false;
    return Boolean(registroSeleccionado.Habilitada ?? registroSeleccionado.habilitada);
  }, [registroSeleccionado]);

  useEffect(() => {
    if (registroSeleccionado) {
      setObservaciones(
        registroSeleccionado.Observaciones ?? registroSeleccionado.observaciones ?? "",
      );
      const hList = registroSeleccionado.Horarios ?? registroSeleccionado.horarios ?? [];
      setHorarios(Array.isArray(hList) ? [...hList] : []);
    } else {
      setObservaciones("");
      setHorarios([...HORARIOS_RECEPCION_DONACION]);
    }
    setNuevoHorarioPersonalizado("");
    setMensajeExito(null);
  }, [registroSeleccionado]);

  const totalHabilitadasMes = useMemo(() => {
    const mesIso = format(mesActual, "yyyy-MM");
    return Array.from(fechasHabilitadasMap.keys()).filter((iso) =>
      iso.startsWith(mesIso),
    ).length;
  }, [fechasHabilitadasMap, mesActual]);

  const esFechaPasada = fechaSeleccionada
    ? isBefore(startOfDay(fechaSeleccionada), hoy)
    : false;

  const actualizarLocal = (iso, extra) => {
    setFechas((prev) => {
      const existe = prev.some(
        (f) => String(f.Fecha || f.fecha || "").slice(0, 10) === iso,
      );
      if (existe) {
        return prev.map((f) =>
          String(f.Fecha || f.fecha || "").slice(0, 10) === iso
            ? { ...f, ...extra }
            : f,
        );
      }
      return [...prev, { Fecha: iso, fecha: iso, ...extra }];
    });
  };

  const handleToggleEstado = async () => {
    if (!fechaSeleccionada || !puedeEditar) return;
    const iso = toIsoString(fechaSeleccionada);
    const nuevoEstado = !estaHabilitadaSeleccionada;
    setGuardando(true);
    setError(null);
    setMensajeExito(null);
    try {
      await actualizarFechaRecepcionAdmin(iso, nuevoEstado, {
        horarios,
        observaciones,
      });
      actualizarLocal(iso, {
        Habilitada: nuevoEstado,
        habilitada: nuevoEstado,
        Horarios: horarios,
        horarios,
        Observaciones: observaciones,
      });
      setMensajeExito(
        nuevoEstado
          ? `Fecha ${iso} habilitada para recepción de donaciones.`
          : `Fecha ${iso} deshabilitada para recepción de donaciones.`,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al actualizar la disponibilidad de la fecha.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!fechaSeleccionada || !puedeEditar) return;
    const iso = toIsoString(fechaSeleccionada);
    setGuardando(true);
    setError(null);
    setMensajeExito(null);
    try {
      await habilitarFechaRecepcionAdmin(iso, { horarios, observaciones });
      actualizarLocal(iso, {
        Habilitada: true,
        habilitada: true,
        Horarios: horarios,
        horarios,
        Observaciones: observaciones,
      });
      setMensajeExito(
        `Fecha ${iso} guardada y habilitada con ${horarios.length} horario(s) de recepción.`,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al guardar los cambios de la fecha.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarFecha = async (isoTarget) => {
    if (!puedeEditar) return;
    const iso = isoTarget || isoSeleccionada;
    if (!iso) return;
    if (!window.confirm(`¿Desea eliminar la configuración de recepción del ${iso}?`)) {
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await eliminarFechaRecepcionAdmin(iso);
      setFechas((prev) =>
        prev.filter((f) => String(f.Fecha || f.fecha || "").slice(0, 10) !== iso),
      );
      if (isoSeleccionada === iso) setFechaSeleccionada(null);
      setMensajeExito(`Fecha de recepción ${iso} eliminada.`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al eliminar el registro de la fecha.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (showLoading) {
    return (
      <AdminLayout>
        <AdminPageGate showLoading message={loadingMessage} />
      </AdminLayout>
    );
  }

  if (!puedeVer) {
    return (
      <AdminLayout>
        <p className="text-slate-600">
          <ST>No tiene permiso para ver las fechas de recepción de donaciones.</ST>
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
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
              <ST>Actualizar datos</ST>
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 border border-slate-100">
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
                <ST>Haga clic en cualquier día para configurar su horario de recepción.</ST>
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 flex items-center gap-2">
            <XCircle className="size-5 shrink-0" />
            <span><ST>{error}</ST></span>
          </div>
        ) : null}

        {mensajeExito ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0" />
            <span><ST>{mensajeExito}</ST></span>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(21rem,1fr)]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="size-5 text-slate-700" />
                <ST>Disponibilidad de recepción</ST>
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
                onSelect={(date) => {
                  setFechaSeleccionada(date || null);
                  setError(null);
                  setMensajeExito(null);
                }}
                locale={locale}
                modifiers={{ habilitado: fechasHabilitadasDates }}
                modifiersClassNames={{ habilitado: "rdp-day-habilitado" }}
                captionLayout="dropdown"
              />
            </div>
            <div className="w-full mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full border-2 border-slate-950 bg-white font-bold text-slate-950 text-[11px]">
                  15
                </span>
                <span><ST>Día habilitado para recibir donaciones</ST></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center font-medium text-slate-700 text-[11px]">
                  15
                </span>
                <span><ST>Día no habilitado</ST></span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              <ST>Detalles del día seleccionado</ST>
            </h3>
            {fechaSeleccionada ? (
              <div className="space-y-5 flex-1 flex flex-col">
                <div>
                  <p className="text-lg font-bold text-slate-950 capitalize mt-0.5">
                    {format(fechaSeleccionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale })}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ISO: {isoSeleccionada}</p>
                </div>
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
                        {estaHabilitadaSeleccionada ? (
                          <ST>Fecha Habilitada</ST>
                        ) : (
                          <ST>Fecha No Habilitada</ST>
                        )}
                      </p>
                      <p className={`text-xs ${estaHabilitadaSeleccionada ? "text-slate-200" : "text-slate-500"}`}>
                        {estaHabilitadaSeleccionada ? (
                          <ST>Disponible para entregar donaciones</ST>
                        ) : (
                          <ST>Bloqueada para recepción</ST>
                        )}
                      </p>
                    </div>
                  </div>
                  {puedeEditar ? (
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
                      {guardando ? "..." : estaHabilitadaSeleccionada ? <ST>Deshabilitar</ST> : <ST>Habilitar ahora</ST>}
                    </button>
                  ) : null}
                </div>

                {esFechaPasada ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <ST>Esta fecha ya pasó. No se puede modificar su disponibilidad.</ST>
                  </p>
                ) : null}

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      <ST>Horarios de recepción para esta fecha:</ST>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {horarios.length} configurado(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-2 rounded-lg bg-slate-50 border border-slate-200">
                    {horarios.length === 0 ? (
                      <span className="text-xs text-slate-400 italic py-1 px-1">
                        <ST>No hay horarios configurados. Añada al menos uno abajo.</ST>
                      </span>
                    ) : (
                      horarios.map((h) => (
                        <span
                          key={h}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-300 shadow-2xs"
                        >
                          <Clock className="size-3 text-slate-500" />
                          <span>{h}</span>
                          {puedeEditar && !esFechaPasada ? (
                            <button
                              type="button"
                              onClick={() => setHorarios((prev) => prev.filter((item) => item !== h))}
                              className="text-slate-400 hover:text-red-600 transition ml-0.5"
                            >
                              <X className="size-3" />
                            </button>
                          ) : null}
                        </span>
                      ))
                    )}
                  </div>
                  {puedeEditar && !esFechaPasada ? (
                    <>
                      <div>
                        <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                          <ST>Agregar horario predeterminado:</ST>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {HORARIOS_RECEPCION_DONACION.map((hp) => {
                            const yaAgregado = horarios.includes(hp);
                            return (
                              <button
                                key={hp}
                                type="button"
                                onClick={() => {
                                  if (!yaAgregado) setHorarios((prev) => [...prev, hp]);
                                }}
                                disabled={yaAgregado || guardando}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition border ${
                                  yaAgregado
                                    ? "bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                                }`}
                              >
                                <Plus className="size-3" />
                                <span>{hp}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const limpio = nuevoHorarioPersonalizado.trim();
                          if (!limpio || horarios.includes(limpio)) return;
                          setHorarios((prev) => [...prev, limpio]);
                          setNuevoHorarioPersonalizado("");
                        }}
                        className="flex gap-2 pt-1"
                      >
                        <input
                          type="text"
                          placeholder="Ej. 9:00 a. m. – 1:00 p. m."
                          value={nuevoHorarioPersonalizado}
                          onChange={(e) => setNuevoHorarioPersonalizado(e.target.value)}
                          disabled={guardando}
                          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition"
                        />
                        <button
                          type="submit"
                          disabled={!nuevoHorarioPersonalizado.trim() || guardando}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                        >
                          <Plus className="size-3.5" />
                          <ST>Agregar</ST>
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      <ST>Observaciones internas (opcional):</ST>
                    </label>
                    <textarea
                      rows={2}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      disabled={guardando || esFechaPasada || !puedeEditar}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-950 focus:bg-white transition resize-none"
                    />
                  </div>
                </div>

                {puedeEditar ? (
                  <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleGuardarCambios}
                      disabled={guardando || esFechaPasada}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Save className="size-4" />
                      {guardando ? <ST>Guardando...</ST> : <ST>Guardar cambios de la fecha</ST>}
                    </button>
                    {registroSeleccionado ? (
                      <button
                        type="button"
                        onClick={() => handleEliminarFecha(isoSeleccionada)}
                        disabled={guardando}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        <ST>Eliminar configuración de esta fecha</ST>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CalendarDays className="size-12 stroke-[1.2] text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  <ST>Seleccione una fecha del calendario</ST>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-slate-800" />
              <h3 className="text-base font-bold text-slate-950">
                <ST>Fechas de recepción configuradas</ST>
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {fechas.length} {fechas.length === 1 ? "registro total" : "registros totales"}
            </span>
          </div>
          {fechas.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              <ST>No hay fechas de recepción configuradas aún.</ST>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3"><ST>Fecha</ST></th>
                    <th className="px-4 py-3"><ST>Estado</ST></th>
                    <th className="px-4 py-3"><ST>Horarios</ST></th>
                    <th className="px-4 py-3"><ST>Observaciones</ST></th>
                    <th className="px-4 py-3 text-right"><ST>Acciones</ST></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fechas.map((f) => {
                    const iso = String(f.Fecha || f.fecha || "").slice(0, 10);
                    const hab = Boolean(f.Habilitada ?? f.habilitada);
                    const hList = f.Horarios ?? f.horarios ?? [];
                    const dateObj = parseIsoLocal(iso);
                    return (
                      <tr key={iso} className={isoSeleccionada === iso ? "bg-slate-50 font-semibold" : ""}>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                          {dateObj ? format(dateObj, "EEE, dd MMM yyyy", { locale }) : iso}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {hab ? <ST>Habilitada</ST> : <ST>Deshabilitada</ST>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(Array.isArray(hList) ? hList : []).map((hor) => (
                              <span key={hor} className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                {hor}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">
                          {f.Observaciones ?? f.observaciones ?? "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => dateObj && setFechaSeleccionada(dateObj)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                          >
                            <ST>Editar</ST>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
