import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, Power, RefreshCw, X } from "lucide-react";

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
  actualizarActivoFijo,
  cambiarEstadoActivoFijo,
  crearActivoFijo,
  obtenerActivosFijos,
} from "../../../services/activosFijosService";
import { getActiveSessionUser } from "../../../services/sessionService";

const EMPTY_FORM = {
  codigo: "",
  nombre: "",
  modelo: "",
  numeroSerie: "",
  fechaCompra: "",
  valorEnLibro: "0",
  codigoProyecto: "",
  nombreCompleto: "",
  descripcionResponsable: "",
  descripcionProyecto: "",
};

function formatCRC(value) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const valor = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(valor.getTime())) return fecha;
  return valor.toLocaleDateString("es-CR");
}

function ActivoFormModal({ open, inicial, onClose, onSave, isSaving, error }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...inicial }));
  const [validationError, setValidationError] = useState("");
  const editando = Boolean(inicial?.id);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY_FORM,
      ...(inicial || {}),
      valorEnLibro:
        inicial?.valorEnLibro === undefined || inicial?.valorEnLibro === null
          ? "0"
          : String(inicial.valorEnLibro),
    });
    setValidationError("");
  }, [open, inicial]);

  if (!open) return null;

  const message = validationError || error;
  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setValidationError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const codigo = form.codigo.trim();
    const nombre = form.nombre.trim();
    if (!codigo || codigo.length > 50) {
      setValidationError("El código es obligatorio (máx. 50 caracteres).");
      return;
    }
    if (nombre.length < 2 || nombre.length > 200) {
      setValidationError("El nombre debe tener entre 2 y 200 caracteres.");
      return;
    }
    const valor = Number(form.valorEnLibro);
    if (!Number.isFinite(valor) || valor < 0) {
      setValidationError("El valor en libro debe ser un número mayor o igual a 0.");
      return;
    }

    await onSave({
      codigo,
      nombre,
      modelo: form.modelo.trim(),
      numeroSerie: form.numeroSerie.trim(),
      fechaCompra: form.fechaCompra || null,
      valorEnLibro: valor,
      codigoProyecto: form.codigoProyecto.trim(),
      nombreCompleto: form.nombreCompleto.trim(),
      descripcionResponsable: form.descripcionResponsable.trim(),
      descripcionProyecto: form.descripcionProyecto.trim(),
    });
  };

  const fieldClass =
    "min-h-[var(--control-height)] rounded-full border border-slate-200 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-2xl" labelledBy="activo-fijo-modal-title">
      <AdminModalHeader>
        <h2 id="activo-fijo-modal-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
          {editando ? "Editar activo fijo" : "Agregar activo fijo"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Código
              <input name="codigo" value={form.codigo} onChange={setField("codigo")} className={fieldClass} required />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Nombre
              <input name="nombre" value={form.nombre} onChange={setField("nombre")} className={fieldClass} required />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Modelo
              <input name="modelo" value={form.modelo} onChange={setField("modelo")} className={fieldClass} />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Número de serie
              <input name="numeroSerie" value={form.numeroSerie} onChange={setField("numeroSerie")} className={fieldClass} />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Fecha de compra
              <input
                name="fechaCompra"
                type="date"
                value={form.fechaCompra || ""}
                onChange={setField("fechaCompra")}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Valor en libro
              <input
                name="valorEnLibro"
                type="number"
                min="0"
                step="0.01"
                value={form.valorEnLibro}
                onChange={setField("valorEnLibro")}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Código de proyecto
              <input name="codigoProyecto" value={form.codigoProyecto} onChange={setField("codigoProyecto")} className={fieldClass} />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
              Nombre completo
              <input name="nombreCompleto" value={form.nombreCompleto} onChange={setField("nombreCompleto")} className={fieldClass} />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700 sm:col-span-2">
              Responsable
              <input
                name="descripcionResponsable"
                value={form.descripcionResponsable}
                onChange={setField("descripcionResponsable")}
                className={fieldClass}
              />
            </label>
            <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700 sm:col-span-2">
              Descripción del proyecto
              <input
                name="descripcionProyecto"
                value={form.descripcionProyecto}
                onChange={setField("descripcionProyecto")}
                className={fieldClass}
              />
            </label>
          </div>
          {message ? (
            <p className="text-[length:var(--text-body)] text-red-600" role="alert">
              {message}
            </p>
          ) : null}
          <div className="border-t border-slate-100 pt-4">
            <AdminModalActions
              onCancel={onClose}
              primaryLabel={isSaving ? "Guardando..." : editando ? "Guardar cambios" : "Crear activo"}
              primaryDisabled={isSaving}
            />
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}

export default function AdminActivosFijos() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer = tienePermiso(roles, "ver_inventario");
  const puedeCrear = tienePermiso(roles, "agregar_articulo_inventario");
  const puedeEditar = tienePermiso(roles, "actualizar_inventario");
  const puedeInactivar = tienePermiso(roles, "inactivar_articulo_inventario");

  const [activos, setActivos] = useState([]);
  const [status, setStatus] = useState("idle");
  const [loadError, setLoadError] = useState("");
  const [editor, setEditor] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = async () => {
    setStatus("loading");
    setLoadError("");
    try {
      const data = await obtenerActivosFijos({ incluirInactivos: true });
      setActivos(data);
      setStatus("success");
    } catch (error) {
      setActivos([]);
      setStatus("error");
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los activos.");
    }
  };

  useEffect(() => {
    if (puedeVer) load();
    else setStatus("success");
  }, [puedeVer]);

  const ready = !puedeVer || status !== "idle";
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/activos-fijos", ready);

  const filters = useAdminListaFiltros(activos, {
    buscarEn: (activo) => [
      activo.codigo,
      activo.nombre,
      activo.modelo,
      activo.numeroSerie,
      activo.codigoProyecto,
      activo.nombreCompleto,
      activo.descripcionResponsable,
      activo.descripcionProyecto,
    ],
    filtrosConfig: [
      {
        id: "estado",
        aplicar: (lista, valor) => {
          if (valor === "activos") return lista.filter((item) => item.activo);
          if (valor === "inactivos") return lista.filter((item) => !item.activo);
          return lista;
        },
      },
    ],
  });

  const totalValor = useMemo(
    () => filters.filtrados.reduce((acc, item) => acc + (Number(item.valorEnLibro) || 0), 0),
    [filters.filtrados],
  );

  const handleSave = async (payload) => {
    setIsSaving(true);
    setFormError("");
    setSuccessMessage("");
    try {
      if (editor?.id) {
        await actualizarActivoFijo(editor.id, payload);
        setSuccessMessage(`Se actualizó ${payload.nombre}.`);
      } else {
        await crearActivoFijo(payload);
        setSuccessMessage(`Se agregó ${payload.nombre}.`);
      }
      setEditor(null);
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar el activo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (activo) => {
    setTogglingId(activo.id);
    setSuccessMessage("");
    try {
      const actualizado = await cambiarEstadoActivoFijo(activo.id, !activo.activo);
      await load();
      setSuccessMessage(
        actualizado.activo
          ? `${actualizado.nombre} quedó activo.`
          : `${actualizado.nombre} quedó inhabilitado.`,
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
    } finally {
      setTogglingId("");
    }
  };

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-[0.16em] text-amber-800">
                Inventario
              </p>
              <h1 className="mt-1 text-[length:var(--text-title)] font-semibold text-slate-950">Activos fijos</h1>
              <p className="mt-2 max-w-2xl text-[length:var(--text-body)] text-slate-500">
                Equipo y mobiliario en un solo inventario, sin ubicaciones de punto de venta.
              </p>
            </div>
            {puedeCrear ? (
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setEditor({ mode: "create" });
                }}
                className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 text-[length:var(--text-body)] font-semibold text-white hover:bg-neutral-800"
              >
                <Plus className="size-4" aria-hidden="true" />
                Agregar activo
              </button>
            ) : null}
          </header>

          {successMessage ? (
            <div
              className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[length:var(--text-body)] font-medium text-emerald-800"
              role="status"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {successMessage}
            </div>
          ) : null}

          {!puedeVer ? (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
              <h2 className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">Acceso restringido</h2>
              <p className="mx-auto mt-2 max-w-md text-[length:var(--text-body)] text-slate-500">
                No tenés permiso para consultar activos fijos.
              </p>
            </section>
          ) : status === "loading" ? (
            <section className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="admin-route-loading__spinner" aria-hidden="true" />
              <p className="text-[length:var(--text-body)] font-semibold text-slate-600">Cargando activos fijos...</p>
            </section>
          ) : status === "error" ? (
            <section className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-white px-5 text-center">
              <p className="text-[length:var(--text-body)] font-semibold text-red-700">{loadError}</p>
              <button
                type="button"
                onClick={load}
                className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-amber-800 bg-amber-800 px-4 text-[length:var(--text-body)] font-semibold text-white"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Reintentar
              </button>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">
                    Total en libro (filtro actual)
                  </p>
                  <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-slate-950">
                    {formatCRC(totalValor)}
                  </p>
                </div>
                <p className="text-[length:var(--text-body)] text-slate-500">{filters.visibles} activos visibles</p>
              </div>

              <AdminListaToolbar
                busqueda={filters.busqueda}
                onBusquedaChange={filters.setBusqueda}
                placeholder="Buscar por código, nombre, proyecto o responsable..."
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
                      { value: "activos", label: "Activos" },
                      { value: "inactivos", label: "Inactivos" },
                    ],
                  },
                ]}
              />

              {filters.filtrados.length === 0 ? (
                <AdminListaVacia onLimpiar={filters.limpiar} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[length:var(--text-body)]">
                    <thead className="border-y border-slate-100 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold sm:px-6">Código</th>
                        <th className="px-4 py-3 font-semibold">Nombre</th>
                        <th className="hidden px-4 py-3 font-semibold md:table-cell">Compra</th>
                        <th className="px-4 py-3 font-semibold">Valor</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold sm:px-6">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filters.filtrados.map((activo) => (
                        <tr key={activo.id} className="border-b border-slate-100 align-top">
                          <td className="px-4 py-3 font-semibold text-slate-900 sm:px-6">{activo.codigo}</td>
                          <td className="px-4 py-3 text-slate-800">
                            <div>{activo.nombre}</div>
                            {activo.descripcionResponsable ? (
                              <div className="mt-1 text-slate-500">{activo.descripcionResponsable}</div>
                            ) : null}
                          </td>
                          <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{formatFecha(activo.fechaCompra)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{formatCRC(activo.valorEnLibro)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                activo.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {activo.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 sm:px-6">
                            <div className="flex flex-wrap gap-1">
                              {puedeEditar ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormError("");
                                    setEditor(activo);
                                  }}
                                  className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-slate-950 bg-slate-950 px-2 text-[11px] font-semibold leading-none text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
                                >
                                  <Pencil className="size-3 shrink-0" aria-hidden="true" />
                                  <span>Editar</span>
                                </button>
                              ) : null}
                              {puedeInactivar ? (
                                <button
                                  type="button"
                                  disabled={togglingId === activo.id}
                                  onClick={() => handleToggle(activo)}
                                  className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    activo.activo
                                      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
                                  }`}
                                >
                                  <Power className="size-3 shrink-0" aria-hidden="true" />
                                  <span>
                                    {togglingId === activo.id
                                      ? "..."
                                      : activo.activo
                                        ? "Inactivar"
                                        : "Activar"}
                                  </span>
                                </button>
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

          <ActivoFormModal
            key={editor?.id || editor?.mode || "closed"}
            open={Boolean(editor)}
            inicial={editor?.id ? editor : null}
            onClose={() => {
              setEditor(null);
              setFormError("");
            }}
            onSave={handleSave}
            isSaving={isSaving}
            error={formError}
          />
        </div>
      </AdminLayout>
    </AdminPageGate>
  );
}
