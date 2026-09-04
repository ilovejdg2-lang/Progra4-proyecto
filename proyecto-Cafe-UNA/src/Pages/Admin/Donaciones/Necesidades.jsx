import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Power } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../Components/Admin/ui/AdminModal";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import {
  actualizarNecesidad,
  crearNecesidad,
  inactivarNecesidad,
  obtenerNecesidadesAdmin,
} from "../../../services/donacionesService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { ST } from "../../../Components/T/ST";
import { t } from "../../../lib/t";
import { useIdioma } from "../../../lib/useIdioma";

const EMPTY = { titulo: "", descripcion: "", prioridad: "MEDIA", cantidadRequerida: "" };

function etiquetaPrioridad(prioridad) {
  if (prioridad === "ALTA") return "Alta";
  if (prioridad === "MEDIA") return "Media";
  return "Baja";
}

function clasePrioridad(prioridad) {
  if (prioridad === "ALTA") return "bg-slate-100 text-red-600";
  if (prioridad === "MEDIA") return "bg-slate-100 text-yellow-500";
  return "bg-slate-100 text-green-600";
}

export default function AdminNecesidadesDonacion() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer =
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
    tienePermiso(roles, "ver_solicitudes_donacion");
  const puedeEditar = tienePermiso(roles, "administrar_solicitudes_donaciones");
  const { idioma } = useIdioma();

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    if (!puedeVer) return;
    setStatus("loading");
    setError("");
    try {
      setItems(await obtenerNecesidadesAdmin());
      setStatus("success");
    } catch (loadError) {
      setItems([]);
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las necesidades.");
    }
  }, [puedeVer]);

  useEffect(() => {
    load();
  }, [load]);

  const filtrosConfig = useMemo(
    () => [
      {
        id: "estado",
        aplicar: (lista, valor) => {
          if (valor === "activas") return lista.filter((item) => item.estado === "ACTIVA");
          if (valor === "inactivas") return lista.filter((item) => item.estado === "INACTIVA");
          return lista;
        },
      },
      {
        id: "prioridad",
        aplicar: (lista, valor) => {
          if (valor === "ALTA" || valor === "MEDIA" || valor === "BAJA") {
            return lista.filter((item) => item.prioridad === valor);
          }
          return lista;
        },
      },
    ],
    [],
  );

  const filters = useAdminListaFiltros(items, {
    buscarEn: (row) => [row.titulo, row.descripcion],
    filtrosConfig,
  });

  const { showLoading, loadingMessage } = useAdminPageGate(
    "/admin/donaciones/necesidades",
    status !== "idle",
  );

  const opcionesPrioridad = useMemo(
    () => [
      { value: "ALTA", label: t("Alta") },
      { value: "MEDIA", label: t("Media") },
      { value: "BAJA", label: t("Baja") },
    ],
    [idioma],
  );

  function abrirNueva() {
    setEditando(null);
    setForm(EMPTY);
    setFormError("");
    setFormOpen(true);
  }

  function abrirEditar(row) {
    setEditando(row);
    setForm({
      titulo: row.titulo,
      descripcion: row.descripcion,
      prioridad: row.prioridad || "MEDIA",
      cantidadRequerida: row.cantidadRequerida ? String(row.cantidadRequerida) : "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function guardar() {
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setFormError("El título y la descripción son obligatorios.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        prioridad: form.prioridad,
        cantidadRequerida: form.cantidadRequerida ? Number(form.cantidadRequerida) : null,
      };
      if (editando) await actualizarNecesidad(editando.id, payload);
      else await crearNecesidad(payload);
      setFormOpen(false);
      await load();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEstado(row) {
    if (!puedeEditar) return;
    try {
      if (row.estado === "ACTIVA") await inactivarNecesidad(row.id);
      else await actualizarNecesidad(row.id, { estado: "ACTIVA" });
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No se pudo cambiar el estado.");
    }
  }

  if (showLoading) {
    return (
      <AdminLayout>
        <AdminPageGate showLoading message={loadingMessage} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[length:var(--text-title)] font-semibold text-slate-900">
              <ST>Necesidades de donación</ST>
            </h1>
            <p className="mt-1 text-[length:var(--text-body)] text-slate-500">
              <ST>Publicá y desactivá necesidades del catálogo público.</ST>
            </p>
          </div>
          {puedeEditar ? (
            <button
              type="button"
              onClick={abrirNueva}
              className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full bg-slate-900 px-4 text-[length:var(--text-body)] font-semibold text-white"
            >
              <Plus className="size-4" />
              <ST>Nueva necesidad</ST>
            </button>
          ) : null}
        </header>

        {!puedeVer ? (
          <p className="text-[length:var(--text-body)] text-slate-600">
            <ST>No tiene permiso para administrar donaciones.</ST>
          </p>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {error ? <p className="px-6 py-3 text-rose-700">{error}</p> : null}
            <AdminListaToolbar
              busqueda={filters.busqueda}
              onBusquedaChange={filters.setBusqueda}
              placeholder="Buscar necesidad..."
              total={filters.total}
              visibles={filters.visibles}
              hayFiltrosActivos={filters.hayFiltrosActivos}
              onLimpiar={filters.limpiar}
              filtros={[
                {
                  id: "estado",
                  label: "Estado",
                  value: filters.valoresFiltro.estado || "todos",
                  onChange: (valor) => filters.setValorFiltro("estado", valor),
                  opciones: [
                    { value: "todos", label: "Todos" },
                    { value: "activas", label: "Activas" },
                    { value: "inactivas", label: "Inactivas" },
                  ],
                },
                {
                  id: "prioridad",
                  label: "Prioridad",
                  value: filters.valoresFiltro.prioridad || "todos",
                  onChange: (valor) => filters.setValorFiltro("prioridad", valor),
                  opciones: [
                    { value: "todos", label: "Todas" },
                    { value: "ALTA", label: "Alta" },
                    { value: "MEDIA", label: "Media" },
                    { value: "BAJA", label: "Baja" },
                  ],
                },
              ]}
            />
            {filters.filtrados.length === 0 ? (
              <AdminListaVacia onLimpiar={filters.limpiar} />
            ) : (
              <div className="admin-table-shell">
                <table className="w-full min-w-[720px] text-center text-[length:var(--text-body)]">
                  <thead>
                    <tr>
                      <th><ST>Título</ST></th>
                      <th><ST>Prioridad</ST></th>
                      <th><ST>Estado</ST></th>
                      <th><ST>Acciones</ST></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filters.filtrados.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="px-6 py-4 text-center font-medium"><ST>{row.titulo}</ST></td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block rounded-full px-3 py-0.5 font-semibold ${clasePrioridad(row.prioridad)}`}>
                            <ST>{etiquetaPrioridad(row.prioridad)}</ST>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-semibold ${
                              row.estado === "ACTIVA" ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            <ST>{row.estado === "ACTIVA" ? "Activa" : "Inactiva"}</ST>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {puedeEditar ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => abrirEditar(row)}
                                  className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-slate-950 bg-slate-950 px-2 text-[length:var(--text-body)] font-semibold leading-none text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                                >
                                  <Pencil className="size-3 shrink-0" aria-hidden="true" />
                                  <span><ST>Editar</ST></span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleEstado(row)}
                                  className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-[length:var(--text-body)] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                                    row.estado === "ACTIVA"
                                      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
                                  }`}
                                >
                                  <Power className="size-3 shrink-0" aria-hidden="true" />
                                  <span><ST>{row.estado === "ACTIVA" ? "Inactivar" : "Activar"}</ST></span>
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      <AdminModal open={formOpen} onClose={() => setFormOpen(false)} labelledBy="necesidad-modal">
        <AdminModalHeader id="necesidad-modal">
          <ST>{editando ? "Editar necesidad" : "Nueva necesidad"}</ST>
        </AdminModalHeader>
        <AdminModalBody>
          <div className="grid gap-3">
            <label className="grid gap-1 text-[length:var(--text-body)] font-semibold">
              <ST>Título</ST>
              <input
                value={form.titulo}
                onChange={(event) => setForm((c) => ({ ...c, titulo: event.target.value }))}
                className="h-[var(--control-height)] rounded-full border border-slate-200 px-4"
                maxLength={200}
              />
            </label>
            <label className="grid gap-1 text-[length:var(--text-body)] font-semibold">
              <ST>Descripción</ST>
              <textarea
                value={form.descripcion}
                onChange={(event) => setForm((c) => ({ ...c, descripcion: event.target.value }))}
                className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-[length:var(--text-body)]"
                maxLength={2000}
              />
            </label>
            <label className="grid gap-1 text-[length:var(--text-body)] font-semibold">
              <ST>Prioridad</ST>
              <select
                value={form.prioridad}
                onChange={(event) => setForm((c) => ({ ...c, prioridad: event.target.value }))}
                className="h-[var(--control-height)] rounded-full border border-slate-200 px-4"
              >
                {opcionesPrioridad.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[length:var(--text-body)] font-semibold">
              <ST>Cantidad requerida (opcional)</ST>
              <NumericInput
                value={form.cantidadRequerida}
                onChange={(event) => setForm((c) => ({ ...c, cantidadRequerida: event.target.value }))}
                className="h-[var(--control-height)] rounded-full border border-slate-200 px-4"
              />
            </label>
            {formError ? <p className="text-rose-700">{formError}</p> : null}
          </div>
        </AdminModalBody>
        <AdminModalActions>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="h-[var(--control-height)] rounded-full border border-slate-200 px-4 font-semibold"
          >
            <ST>Cancelar</ST>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={guardar}
            className="h-[var(--control-height)] rounded-full bg-slate-900 px-4 font-semibold text-white"
          >
            <ST>{saving ? "Guardando..." : "Guardar"}</ST>
          </button>
        </AdminModalActions>
      </AdminModal>
    </AdminLayout>
  );
}
