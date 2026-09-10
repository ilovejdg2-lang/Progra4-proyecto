import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { Calendar } from "@/Components/ui/calendar";
import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalFooter,
  AdminModalHeader,
} from "../../../Components/Admin/ui/AdminModal";
import {
  actualizarDisponibilidadVisita,
  crearDisponibilidadVisita,
  obtenerDisponibilidadVisitasAdmin,
} from "../../../services/visitasService";

function parseIsoLocal(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = String(isoStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function sortSlots(slots) {
  return [...slots].sort((a, b) =>
    `${a.fecha}-${a.horaInicio}`.localeCompare(`${b.fecha}-${b.horaInicio}`),
  );
}

const EMPTY_SLOT_FORM = {
  fecha: "",
  horaInicio: "09:00",
  horaFin: "11:00",
  habilitada: true,
  nota: "",
};

export function GestionFechasVisitas({ esSuperAdmin = false }) {
  const hoy = useMemo(() => startOfDay(new Date()), []);
  const [slots, setSlots] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [slotEditando, setSlotEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_SLOT_FORM);
  const [formError, setFormError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busyId, setBusyId] = useState("");

  const cargarHorarios = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await obtenerDisponibilidadVisitasAdmin();
      const ordenados = sortSlots(data);
      setSlots(ordenados);
      if (ordenados.length > 0) {
        const primeraFecha = parseIsoLocal(ordenados[0].fecha);
        if (primeraFecha) setFechaSeleccionada(primeraFecha);
      }
    } catch (loadError) {
      setError(loadError?.message || "No se pudieron cargar los horarios de visitas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarHorarios();
  }, [cargarHorarios]);

  // Mapa de fechas a slots (YYYY-MM-DD -> slot[])
  const slotsPorFecha = useMemo(() => {
    const map = new Map();
    for (const slot of slots) {
      const iso = String(slot.fecha || "").slice(0, 10);
      if (!iso) continue;
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(slot);
    }
    return map;
  }, [slots]);

  // Fechas que tienen al menos un turno habilitado
  const fechasConTurnosHabilitados = useMemo(() => {
    const list = [];
    for (const [iso, lista] of slotsPorFecha) {
      if (lista.some((s) => s.habilitada)) {
        const parsed = parseIsoLocal(iso);
        if (parsed) list.push(parsed);
      }
    }
    return list;
  }, [slotsPorFecha]);

  const isoSeleccionada = useMemo(() => {
    return fechaSeleccionada ? format(fechaSeleccionada, "yyyy-MM-dd") : "";
  }, [fechaSeleccionada]);

  const slotsDelDia = useMemo(() => {
    if (!isoSeleccionada) return [];
    return slotsPorFecha.get(isoSeleccionada) || [];
  }, [isoSeleccionada, slotsPorFecha]);

  const abrirNuevoSlot = () => {
    setSlotEditando(null);
    setForm({
      ...EMPTY_SLOT_FORM,
      fecha: isoSeleccionada || format(hoy, "yyyy-MM-dd"),
    });
    setFormError("");
    setModalAbierto(true);
  };

  const abrirEditarSlot = (slot) => {
    setSlotEditando(slot);
    setForm({
      fecha: slot.fecha,
      horaInicio: slot.horaInicio.slice(0, 5),
      horaFin: slot.horaFin.slice(0, 5),
      habilitada: slot.habilitada,
      nota: slot.nota || "",
    });
    setFormError("");
    setModalAbierto(true);
  };

  const guardarSlot = async () => {
    if (!form.fecha || !form.horaInicio || !form.horaFin) {
      setFormError("La fecha y las horas de inicio y fin son obligatorias.");
      return;
    }
    if (form.horaFin <= form.horaInicio) {
      setFormError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setGuardando(true);
    setFormError("");
    try {
      const payload = {
        fecha: form.fecha,
        horaInicio: form.horaInicio.length === 5 ? `${form.horaInicio}:00` : form.horaInicio,
        horaFin: form.horaFin.length === 5 ? `${form.horaFin}:00` : form.horaFin,
        habilitada: form.habilitada,
        nota: form.nota.trim(),
      };

      if (slotEditando) {
        const actualizado = await actualizarDisponibilidadVisita(slotEditando.id, payload);
        setSlots((current) =>
          sortSlots(current.map((s) => (s.id === actualizado.id ? actualizado : s))),
        );
        setMensajeExito(`Horario de las ${form.horaInicio} actualizado exitosamente.`);
      } else {
        const creado = await crearDisponibilidadVisita(payload);
        setSlots((current) => sortSlots([...current, creado]));
        setMensajeExito(`Nuevo horario creado para el ${form.fecha}.`);
      }

      setModalAbierto(false);
      setTimeout(() => setMensajeExito(""), 4000);
    } catch (saveError) {
      setFormError(saveError?.message || "Error al guardar el horario.");
    } finally {
      setGuardando(false);
    }
  };

  const toggleSlotHabilitado = async (slot) => {
    setBusyId(slot.id);
    setError("");
    try {
      const actualizado = await actualizarDisponibilidadVisita(slot.id, {
        habilitada: !slot.habilitada,
      });
      setSlots((current) =>
        sortSlots(current.map((s) => (s.id === slot.id ? actualizado : s))),
      );
      setMensajeExito(
        `Horario ${slot.horaInicio.slice(0, 5)}–${slot.horaFin.slice(0, 5)} ${
          !slot.habilitada ? "habilitado" : "deshabilitado"
        }.`,
      );
      setTimeout(() => setMensajeExito(""), 3500);
    } catch (toggleError) {
      setError(toggleError?.message || "No se pudo cambiar el estado del horario.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="space-y-6">
      {/* Encabezado */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Gestión de fechas y horarios de visitas
            </h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              Configurá la disponibilidad de fechas y franjas horarias para las visitas grupales.
              Los días habilitados se identifican con un círculo en el calendario.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={cargarHorarios}
              disabled={cargando}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={abrirNuevoSlot}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="size-4" />
              Nuevo horario
            </button>
          </div>
        </div>

        {/* Resumen rápido de turnos */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total horarios</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{slots.length}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Habilitados</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              {slots.filter((s) => s.habilitada).length}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Deshabilitados</p>
            <p className="mt-1 text-2xl font-bold text-rose-900">
              {slots.filter((s) => !s.habilitada).length}
            </p>
          </div>
          <div className="rounded-xl bg-sky-50 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Días con disponibilidad</p>
            <p className="mt-1 text-2xl font-bold text-sky-900">{fechasConTurnosHabilitados.length}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800" role="alert">
          {error}
        </div>
      ) : null}

      {mensajeExito ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800" role="status">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{mensajeExito}</span>
        </div>
      ) : null}

      {/* Grid principal: Calendario + Detalle del día seleccionado */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Calendario */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-6">
          <h2 className="text-lg font-bold text-slate-950 mb-3 flex items-center gap-2">
            <CalendarDays className="size-5 text-slate-700" />
            Calendario de visitas
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Hacé clic en cualquier fecha para consultar o configurar sus franjas horarias.
          </p>

          <div className="flex justify-center my-2">
            <Calendar
              mode="single"
              selected={fechaSeleccionada}
              onSelect={(date) => date && setFechaSeleccionada(date)}
              locale={es}
              modifiers={{
                habilitado: fechasConTurnosHabilitados,
              }}
              modifiersClassNames={{
                habilitado: "rdp-day-habilitado",
              }}
              captionLayout="dropdown"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-5 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full border-2 border-slate-950 bg-white font-bold text-slate-950 text-[11px]">
                15
              </span>
              <span>Día con horario habilitado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[11px]">
                15
              </span>
              <span>Día sin horarios</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Franjas y turnos de la fecha seleccionada */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fecha seleccionada</span>
              <h2 className="text-xl font-bold text-slate-950 capitalize mt-0.5">
                {fechaSeleccionada
                  ? format(fechaSeleccionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })
                  : "Ninguna fecha"}
              </h2>
            </div>
            <button
              type="button"
              onClick={abrirNuevoSlot}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Plus className="size-3.5" />
              Añadir horario
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {cargando ? (
              <p className="py-8 text-center text-sm text-slate-500">Cargando horarios…</p>
            ) : slotsDelDia.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <CalendarX2 className="mx-auto size-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay horarios configurados para este día</p>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Los visitantes no podrán solicitar visitas en esta fecha hasta que se agregue al menos un horario habilitado.
                </p>
                <button
                  type="button"
                  onClick={abrirNuevoSlot}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Plus className="size-3.5" />
                  Crear primer horario para este día
                </button>
              </div>
            ) : (
              slotsDelDia.map((slot) => {
                const franja = `${slot.horaInicio.slice(0, 5)} – ${slot.horaFin.slice(0, 5)}`;
                return (
                  <article
                    key={slot.id}
                    className={`rounded-xl border p-4 transition ${
                      slot.habilitada
                        ? "border-slate-200 bg-white"
                        : "border-slate-200 bg-slate-50/80 opacity-75"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <Clock className="size-4 text-slate-600 shrink-0" />
                          <span className="text-base font-bold text-slate-950">{franja}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              slot.habilitada
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {slot.habilitada ? "Habilitado" : "Deshabilitado"}
                          </span>
                        </div>
                        {slot.nota ? (
                          <p className="mt-1.5 text-xs text-slate-600 pl-6">
                            <strong>Indicación / Cupo:</strong> {slot.nota}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSlotHabilitado(slot)}
                          disabled={busyId === slot.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                            slot.habilitada
                              ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          } disabled:opacity-50`}
                          title={slot.habilitada ? "Deshabilitar turno" : "Habilitar turno"}
                        >
                          <Power className="size-3.5" />
                          <span>{slot.habilitada ? "Deshabilitar" : "Habilitar"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirEditarSlot(slot)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          title="Editar horario"
                        >
                          <Pencil className="size-3.5" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Creación / Edición de Horario */}
      {modalAbierto ? (
        <AdminModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          title={slotEditando ? "Editar horario de visita" : "Nuevo horario de visita"}
        >
          <AdminModalHeader
            title={slotEditando ? "Editar horario de visita" : "Nuevo horario de visita"}
            subtitle="Configurá la fecha, hora de inicio, hora de finalización y notas de la visita."
            onClose={() => setModalAbierto(false)}
          />
          <AdminModalBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                guardarSlot();
              }}
              className="space-y-4"
            >
              {formError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
                  {formError}
                </div>
              ) : null}

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Fecha *
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={(e) => setForm((c) => ({ ...c, fecha: e.target.value }))}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-950 focus:outline-hidden"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  Hora de inicio *
                  <input
                    type="time"
                    name="horaInicio"
                    value={form.horaInicio}
                    onChange={(e) => setForm((c) => ({ ...c, horaInicio: e.target.value }))}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-950 focus:outline-hidden"
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                  Hora de fin *
                  <input
                    type="time"
                    name="horaFin"
                    value={form.horaFin}
                    onChange={(e) => setForm((c) => ({ ...c, horaFin: e.target.value }))}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-950 focus:outline-hidden"
                    required
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Indicaciones o notas (cupos, guía, requerimientos)
                <textarea
                  name="nota"
                  value={form.nota}
                  onChange={(e) => setForm((c) => ({ ...c, nota: e.target.value }))}
                  placeholder="Ej: Máximo 30 personas. Reunión en el portón principal."
                  rows={3}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-950 focus:outline-hidden resize-none"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pt-1">
                <input
                  type="checkbox"
                  name="habilitada"
                  checked={form.habilitada}
                  onChange={(e) => setForm((c) => ({ ...c, habilitada: e.target.checked }))}
                  className="size-4 rounded border-slate-300"
                />
                Habilitar este horario inmediatamente para reservas
              </label>
            </form>
          </AdminModalBody>
          <AdminModalFooter>
            <AdminModalActions
              onCancel={() => setModalAbierto(false)}
              primaryLabel={guardando ? "Guardando…" : slotEditando ? "Actualizar horario" : "Crear horario"}
              primaryDisabled={guardando}
              onPrimary={guardarSlot}
            />
          </AdminModalFooter>
        </AdminModal>
      ) : null}
    </section>
  );
}
