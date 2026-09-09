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
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { useIdioma } from "../../../lib/useIdioma";
import {
  HORARIOS_PREDETERMINADOS,
  TIPOS_VOLUNTARIADO,
} from "../../../lib/voluntariadoCatalogo";
import {
  actualizarEstadoFechaAdmin,
  eliminarFechaAdmin,
  habilitarFechaAdmin,
  obtenerResumenTipos,
  obtenerTodasFechasAdmin,
  toggleFechaAdmin,
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

function getCantidadFechas(resumen, tipo, esActivo, totalActivas) {
  if (esActivo && typeof totalActivas === "number") {
    return totalActivas;
  }
  if (!tipo) return 0;
  const t = String(tipo).trim();
  const direct = resumen?.[t];
  if (typeof direct === "number") return direct;
  const lower = resumen?.[t.toLowerCase()];
  if (typeof lower === "number") return lower;
  if (t.toLowerCase() === "apoyo general") {
    const gen = resumen?.["General"] ?? resumen?.["general"];
    if (typeof gen === "number") return gen;
  }
  return 0;
}

export function GestionFechasVoluntariado({ esSuperAdmin = false }) {
  const { idioma } = useIdioma();
  const locale = idioma === "en" ? enUS : es;
  const hoy = useMemo(() => startOfDay(new Date()), []);

  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS_VOLUNTARIADO[0]);
  const [resumenTipos, setResumenTipos] = useState({});

  const [fechas, setFechas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const [mesActual, setMesActual] = useState(hoy);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const [cupoMaximo, setCupoMaximo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [nuevoHorarioPersonalizado, setNuevoHorarioPersonalizado] = useState("");

  const tTitulo = useTraducir("Gestión de fechas y horarios de voluntariado");
  const tSub = useTraducir(
    "Configure la disponibilidad de fechas y horarios de forma independiente para cada tipo de voluntariado. Los días habilitados se identifican con un círculo negro en el calendario."
  );

  const cargarResumen = useCallback(async () => {
    try {
      const data = await obtenerResumenTipos();
      setResumenTipos(data || {});
    } catch (err) {
      console.warn("No se pudo cargar el resumen de tipos:", err);
    }
  }, []);

  const cargarFechas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerTodasFechasAdmin(tipoSeleccionado);
      setFechas(Array.isArray(data) ? data : []);
      await cargarResumen();
    } catch (err) {
      console.error("Error al cargar fechas de voluntariado:", err);
      setError("No se pudieron cargar las fechas disponibles. Intente nuevamente.");
    } finally {
      setCargando(false);
    }
  }, [tipoSeleccionado, cargarResumen]);

  useEffect(() => {
    cargarFechas();
  }, [cargarFechas]);

  // Al cambiar de tipo de voluntariado, reiniciar la fecha seleccionada
  const handleCambiarTipo = (tipo) => {
    if (tipo === tipoSeleccionado) return;
    setTipoSeleccionado(tipo);
    setFechaSeleccionada(null);
    setError(null);
    setMensajeExito(null);
  };

  // Mapa de fechas habilitadas (ISO string -> registro) para el tipo seleccionado
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

  // Lista de objetos Date habilitados para react-day-picker
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
      const hList =
        registroSeleccionado.Horarios ?? registroSeleccionado.horarios ?? [];
      setHorarios(Array.isArray(hList) ? [...hList] : []);
    } else {
      setCupoMaximo("");
      setObservaciones("");
      setHorarios([]);
    }
    setNuevoHorarioPersonalizado("");
    setMensajeExito(null);
  }, [registroSeleccionado]);

  const handleSelectFecha = (date) => {
    setFechaSeleccionada(date || null);
    setError(null);
    setMensajeExito(null);
  };

  const handleAgregarHorario = (horarioTexto) => {
    const limpio = String(horarioTexto || "").trim();
    if (!limpio) return;
    if (horarios.includes(limpio)) return;
    setHorarios((prev) => [...prev, limpio]);
  };

  const handleRemoverHorario = (horarioTexto) => {
    setHorarios((prev) => prev.filter((h) => h !== horarioTexto));
  };

  const handleAgregarHorarioPersonalizado = (e) => {
    e.preventDefault();
    if (!nuevoHorarioPersonalizado.trim()) return;
    handleAgregarHorario(nuevoHorarioPersonalizado.trim());
    setNuevoHorarioPersonalizado("");
  };

  const handleToggleEstado = async () => {
    if (!fechaSeleccionada) return;
    const iso = toIsoString(fechaSeleccionada);
    const nuevoEstado = !estaHabilitadaSeleccionada;

    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    try {
      await actualizarEstadoFechaAdmin(tipoSeleccionado, iso, nuevoEstado, {
        horarios,
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
                  Horarios: horarios,
                  horarios: horarios,
                  CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
                  Observaciones: observaciones,
                }
              : f
          );
        }
        return [
          ...prev,
          {
            TipoVoluntariado: tipoSeleccionado,
            Fecha: iso,
            fecha: iso,
            Habilitada: nuevoEstado,
            habilitada: nuevoEstado,
            Horarios: horarios,
            horarios: horarios,
            CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
            Observaciones: observaciones,
          },
        ];
      });

      await cargarResumen();

      setMensajeExito(
        nuevoEstado
          ? `Fecha ${iso} habilitada para "${tipoSeleccionado}".`
          : `Fecha ${iso} deshabilitada para "${tipoSeleccionado}".`
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
      await habilitarFechaAdmin(tipoSeleccionado, iso, {
        horarios,
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
                  Horarios: horarios,
                  horarios: horarios,
                  CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
                  Observaciones: observaciones,
                }
              : f
          );
        }
        return [
          ...prev,
          {
            TipoVoluntariado: tipoSeleccionado,
            Fecha: iso,
            fecha: iso,
            Habilitada: true,
            habilitada: true,
            Horarios: horarios,
            horarios: horarios,
            CupoMaximo: cupoMaximo ? Number(cupoMaximo) : null,
            Observaciones: observaciones,
          },
        ];
      });

      await cargarResumen();

      setMensajeExito(
        `Fecha ${iso} guardada y habilitada con ${horarios.length} horario(s) para "${tipoSeleccionado}".`
      );
    } catch (err) {
      console.error("Error al guardar fecha:", err);
      setError(
        err?.response?.data?.message || "Error al guardar los cambios de la fecha."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarFecha = async (isoTarget) => {
    const iso = isoTarget || (fechaSeleccionada ? toIsoString(fechaSeleccionada) : "");
    if (!iso) return;

    const confirmar = window.confirm(
      `¿Desea eliminar la configuración de la fecha ${iso} para "${tipoSeleccionado}"?`
    );
    if (!confirmar) return;

    setGuardando(true);
    setError(null);
    try {
      await eliminarFechaAdmin(tipoSeleccionado, iso);
      setFechas((prev) =>
        prev.filter((f) => String(f.Fecha || f.fecha || "").slice(0, 10) !== iso)
      );
      if (isoSeleccionada === iso) {
        setFechaSeleccionada(null);
        setCupoMaximo("");
        setObservaciones("");
        setHorarios([]);
      }
      await cargarResumen();
      setMensajeExito(`Fecha ${iso} eliminada del tipo "${tipoSeleccionado}".`);
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
      {/* Encabezado principal */}
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

        {/* Selector de Tipo de Voluntariado */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <ST>Seleccione el tipo de voluntariado a configurar:</ST>
          </label>

          <div className="flex flex-wrap gap-2">
            {TIPOS_VOLUNTARIADO.map((tipo) => {
              const esActivo = tipo === tipoSeleccionado;
              const cantidad = getCantidadFechas(
                resumenTipos,
                tipo,
                esActivo,
                fechasHabilitadasMap.size
              );
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleCambiarTipo(tipo)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition border ${
                    esActivo
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span><ST>{tipo}</ST></span>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      esActivo
                        ? "bg-white/20 text-white"
                        : cantidad > 0
                        ? "bg-slate-100 text-slate-800"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {cantidad} {cantidad === 1 ? "fecha" : "fechas"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen rápido del tipo seleccionado */}
        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 border border-slate-100">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-slate-600" />
            <span className="font-semibold text-slate-900">
              <ST>Tipo actual:</ST> <span className="underline decoration-slate-400 font-bold">{tipoSeleccionado}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
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
              <ST>Haga clic en cualquier día para configurar su horario y disponibilidad.</ST>
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

      {/* Contenedor principal: Calendario + Panel de Configuración de la Fecha */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(21rem,1fr)]">
        {/* Calendario con react-day-picker */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="size-5 text-slate-700" />
              <span>
                <ST>Disponibilidad para</ST> <strong>{tipoSeleccionado}</strong>
              </span>
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

          {/* Leyenda visual */}
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

        {/* Panel lateral: Configuración del día seleccionado */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            <ST>Detalles del día seleccionado</ST>
          </h3>

          {fechaSeleccionada ? (
            <div className="space-y-5 flex-1 flex flex-col">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  <ST>Tipo de voluntariado:</ST> <strong>{tipoSeleccionado}</strong>
                </span>
                <p className="text-lg font-bold text-slate-950 capitalize mt-0.5">
                  {format(fechaSeleccionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale })}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ISO: {isoSeleccionada}</p>
              </div>

              {/* Indicador de estado y botón de activación rápida */}
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
                        ? <ST>Disponible para solicitar este voluntariado</ST>
                        : <ST>Bloqueada para este voluntariado</ST>}
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

              {/* GESTIÓN DE HORARIOS / INTERVALOS DISPONIBLES */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    <ST>Horarios e intervalos disponibles para esta fecha:</ST>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {horarios.length} configurado(s)
                  </span>
                </div>

                {/* Lista de horarios asignados a la fecha */}
                <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-2 rounded-lg bg-slate-50 border border-slate-200">
                  {horarios.length === 0 ? (
                    <span className="text-xs text-slate-400 italic py-1 px-1">
                      <ST>No hay horarios configurados para esta fecha. Añada al menos uno abajo.</ST>
                    </span>
                  ) : (
                    horarios.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-300 shadow-2xs"
                      >
                        <Clock className="size-3 text-slate-500" />
                        <span>{h}</span>
                        {!esFechaPasada && (
                          <button
                            type="button"
                            onClick={() => handleRemoverHorario(h)}
                            className="text-slate-400 hover:text-red-600 transition ml-0.5"
                            title="Eliminar horario"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {/* Botones de adición rápida */}
                {!esFechaPasada && (
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      <ST>Agregar horario predeterminado:</ST>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {HORARIOS_PREDETERMINADOS.map((hp) => {
                        const yaAgregado = horarios.includes(hp);
                        return (
                          <button
                            key={hp}
                            type="button"
                            onClick={() => handleAgregarHorario(hp)}
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
                )}

                {/* Agregar horario personalizado */}
                {!esFechaPasada && (
                  <form
                    onSubmit={handleAgregarHorarioPersonalizado}
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
                      <span><ST>Agregar</ST></span>
                    </button>
                  </form>
                )}
              </div>

              {/* Cupo y Observaciones */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
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
                    rows={2}
                    placeholder="Ej. Actividad especial de reforestación"
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

                {registroSeleccionado && (
                  <button
                    type="button"
                    onClick={() => handleEliminarFecha(isoSeleccionada)}
                    disabled={guardando}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    <span><ST>Eliminar configuración de esta fecha</ST></span>
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
                <ST>Haga clic sobre cualquier día para ver su estado actual, habilitarlo, definir sus horarios o modificar sus detalles.</ST>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* VISUALIZACIÓN DE FECHAS Y HORARIOS CONFIGURADOS PARA EL TIPO */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-slate-800" />
            <h3 className="text-base font-bold text-slate-950">
              <ST>Fechas y horarios configurados para:</ST>{" "}
              <span className="underline decoration-slate-400">{tipoSeleccionado}</span>
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {fechas.length} {fechas.length === 1 ? "registro total" : "registros totales"}
          </span>
        </div>

        {fechas.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CalendarCheck2 className="size-10 stroke-[1.2] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              <ST>No hay fechas configuradas aún para este tipo de voluntariado.</ST>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              <ST>Seleccione días en el calendario superior y guarde los horarios disponibles.</ST>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3"><ST>Fecha</ST></th>
                  <th className="px-4 py-3"><ST>Estado</ST></th>
                  <th className="px-4 py-3"><ST>Horarios disponibles</ST></th>
                  <th className="px-4 py-3"><ST>Cupo</ST></th>
                  <th className="px-4 py-3"><ST>Observaciones</ST></th>
                  <th className="px-4 py-3 text-right"><ST>Acciones</ST></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fechas.map((f) => {
                  const iso = String(f.Fecha || f.fecha || "").slice(0, 10);
                  const hab = Boolean(f.Habilitada ?? f.habilitada);
                  const hList = f.Horarios ?? f.horarios ?? [];
                  const esActual = isoSeleccionada === iso;
                  const dateObj = parseIsoLocal(iso);

                  return (
                    <tr
                      key={iso}
                      className={`hover:bg-slate-50/80 transition ${
                        esActual ? "bg-slate-50 font-semibold" : ""
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                        {dateObj
                          ? format(dateObj, "EEE, dd MMM yyyy", { locale })
                          : iso}
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {iso}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            hab
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              hab ? "bg-green-600" : "bg-slate-400"
                            }`}
                          />
                          {hab ? <ST>Habilitada</ST> : <ST>Deshabilitada</ST>}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.isArray(hList) && hList.length > 0 ? (
                            hList.map((hor) => (
                              <span
                                key={hor}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                              >
                                <Clock className="size-3 text-slate-400" />
                                {hor}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              <ST>Sin horarios específicos</ST>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                        {f.CupoMaximo ?? f.cupoMaximo ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">
                        {f.Observaciones ?? f.observaciones ?? "—"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (dateObj) setFechaSeleccionada(dateObj);
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                        >
                          <ST>Editar</ST>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarFecha(iso)}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                          title="Eliminar registro"
                        >
                          <Trash2 className="size-3.5 inline" />
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
  );
}

export default GestionFechasVoluntariado;
