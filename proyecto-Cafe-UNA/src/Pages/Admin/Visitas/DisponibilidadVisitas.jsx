import { useEffect, useState } from "react";
import { Pencil, Plus, Power } from "lucide-react";

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

const EMPTY_FORM = {
  fecha: "",
  horaInicio: "",
  horaFin: "",
  habilitada: true,
  nota: "",
};

function sortSlots(slots) {
  return [...slots].sort((a, b) =>
    `${a.fecha}-${a.horaInicio}`.localeCompare(`${b.fecha}-${b.horaInicio}`),
  );
}

export function DisponibilidadVisitas() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    obtenerDisponibilidadVisitasAdmin()
      .then((data) => {
        if (active) setSlots(sortSlots(data));
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || "No se pudieron cargar los horarios.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (slot) => {
    setEditing(slot);
    setForm({
      fecha: slot.fecha,
      horaInicio: slot.horaInicio.slice(0, 5),
      horaFin: slot.horaFin.slice(0, 5),
      habilitada: slot.habilitada,
      nota: slot.nota || "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.fecha || !form.horaInicio || !form.horaFin) {
      setFormError("La fecha y las horas son obligatorias.");
      return;
    }
    if (form.horaFin <= form.horaInicio) {
      setFormError("La hora de finalización debe ser posterior a la hora de inicio.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, nota: form.nota.trim() };
      const saved = editing
        ? await actualizarDisponibilidadVisita(editing.id, payload)
        : await crearDisponibilidadVisita(payload);
      setSlots((current) => sortSlots(
        editing
          ? current.map((slot) => (slot.id === saved.id ? saved : slot))
          : [...current, saved],
      ));
      setFormOpen(false);
    } catch (saveError) {
      setFormError(saveError?.message || "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (slot) => {
    setBusyId(slot.id);
    setError("");
    try {
      const updated = await actualizarDisponibilidadVisita(slot.id, {
        habilitada: !slot.habilitada,
      });
      setSlots((current) => current.map((row) => (row.id === slot.id ? updated : row)));
    } catch (toggleError) {
      setError(toggleError?.message || "No se pudo cambiar el estado del horario.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Fechas y horarios disponibles</h2>
            <p className="mt-1 text-sm text-slate-600">Publicá los únicos horarios que podrán elegir los grupos.</p>
          </div>
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 font-semibold text-white" onClick={openNew} type="button">
            <Plus size={16} aria-hidden="true" /> Nuevo horario
          </button>
        </header>

        {error ? <p className="px-5 py-3 text-rose-700" role="alert">{error}</p> : null}
        {loading ? (
          <p className="p-6 text-center text-slate-600">Cargando horarios…</p>
        ) : slots.length === 0 ? (
          <p className="p-6 text-center text-slate-600">Todavía no hay horarios configurados.</p>
        ) : (
          <div className="admin-table-shell">
            <table className="w-full min-w-[760px] text-center text-sm">
              <thead><tr><th>Fecha</th><th>Horario</th><th>Indicación</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {slots.map((slot) => (
                  <tr className="border-b border-slate-100" key={slot.id}>
                    <td className="px-4 py-4 font-medium">{slot.fecha}</td>
                    <td className="px-4 py-4">{slot.horaInicio.slice(0, 5)} – {slot.horaFin.slice(0, 5)}</td>
                    <td className="max-w-sm px-4 py-4">{slot.nota || "Sin indicación"}</td>
                    <td className={`px-4 py-4 font-semibold ${slot.habilitada ? "text-emerald-700" : "text-slate-500"}`}>
                      {slot.habilitada ? "Activo" : "Inactivo"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button aria-label={`Editar horario ${slot.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-slate-950 px-3 font-semibold text-white" onClick={() => openEdit(slot)} type="button">
                          <Pencil size={14} aria-hidden="true" /> Editar
                        </button>
                        <button aria-label={`${slot.habilitada ? "Inactivar" : "Activar"} horario ${slot.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-300 px-3 font-semibold text-slate-700 disabled:opacity-60" disabled={busyId === slot.id} onClick={() => toggle(slot)} type="button">
                          <Power size={14} aria-hidden="true" /> {slot.habilitada ? "Inactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminModal open={formOpen} onClose={() => setFormOpen(false)} labelledBy="visita-horario-modal">
        <AdminModalHeader>
          <h2 className="font-bold" id="visita-horario-modal">{editing ? "Editar horario" : "Nuevo horario"}</h2>
        </AdminModalHeader>
        <AdminModalBody>
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm font-semibold">Fecha<input aria-label="Fecha" className="min-h-10 rounded-xl border border-slate-300 px-3" type="date" value={form.fecha} onChange={(event) => setForm((current) => ({ ...current, fecha: event.target.value }))} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">Hora de inicio<input className="min-h-10 rounded-xl border border-slate-300 px-3" type="time" value={form.horaInicio} onChange={(event) => setForm((current) => ({ ...current, horaInicio: event.target.value }))} /></label>
              <label className="grid gap-1 text-sm font-semibold">Hora de finalización<input className="min-h-10 rounded-xl border border-slate-300 px-3" type="time" value={form.horaFin} onChange={(event) => setForm((current) => ({ ...current, horaFin: event.target.value }))} /></label>
            </div>
            <label className="grid gap-1 text-sm font-semibold">Indicación para visitantes<textarea className="min-h-24 rounded-xl border border-slate-300 px-3 py-2" maxLength={500} value={form.nota} onChange={(event) => setForm((current) => ({ ...current, nota: event.target.value }))} /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.habilitada} onChange={(event) => setForm((current) => ({ ...current, habilitada: event.target.checked }))} /> Horario habilitado</label>
            {formError ? <p className="text-sm text-rose-700" role="alert">{formError}</p> : null}
          </div>
        </AdminModalBody>
        <AdminModalFooter>
          <AdminModalActions onCancel={() => setFormOpen(false)} onPrimary={save} primaryDisabled={saving} primaryLabel={saving ? "Guardando…" : editing ? "Guardar" : "Crear"} primaryType="button" />
        </AdminModalFooter>
      </AdminModal>
    </>
  );
}
