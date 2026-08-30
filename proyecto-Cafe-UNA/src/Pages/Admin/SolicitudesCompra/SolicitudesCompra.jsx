import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileUp,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../Components/Admin/ui/AdminModal";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { obtenerCatalogoProductos } from "../../../services/productosService";
import {
  cambiarEstadoSolicitudCompra,
  crearProveedor,
  crearSolicitudCompra,
  descargarProformaAutenticada,
  obtenerProveedores,
  obtenerSolicitudCompra,
  obtenerSolicitudesCompra,
} from "../../../services/solicitudesCompraService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { queueFocusFormError } from "../../../lib/formFocus";
import { ContadorPalabras } from "../../../Components/Admin/ui/CampoLimitePalabras";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { conLimitePalabras, MAX_PALABRAS_NOTAS } from "../../../lib/formLimits";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";
import { asegurarCamposEnEspanol } from "../../../lib/traducir";

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobada", label: "Aprobada" },
  { value: "recibida", label: "Recibida" },
];

const fieldClass =
  "min-h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";

function badgeEstado(estado) {
  if (estado === "aprobada") return "bg-sky-100 text-sky-800";
  if (estado === "recibida") return "bg-emerald-100 text-emerald-800";
  return "bg-slate-100 text-slate-700";
}

function formatFecha(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    const solo = String(valor).slice(0, 10);
    const local = new Date(`${solo}T00:00:00`);
    if (!Number.isNaN(local.getTime())) return local.toLocaleDateString("es-CR");
    return solo;
  }
  return fecha.toLocaleDateString("es-CR");
}

function SolicitudFormModal({
  open,
  onClose,
  onSave,
  isSaving,
  error,
  proveedores,
  productos,
  onCrearProveedor,
}) {
  const [proveedorId, setProveedorId] = useState("");
  const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState("");
  const [notas, setNotas] = useState("");
  const [filas, setFilas] = useState([{ productoId: "", cantidad: "" }]);
  const [pdf, setPdf] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [creandoProveedor, setCreandoProveedor] = useState(false);
  const tSeleccionar = useTraducir("Seleccionar…");
  const tProducto = useTraducir("Producto…");
  const tNuevoProveedor = useTraducir("Nuevo proveedor (nombre)");
  const tCreando = useTraducir("Creando…");
  const tAgregarProveedor = useTraducir("Agregar proveedor");
  const tCantidad = useTraducir("Cantidad");

  useEffect(() => {
    if (!open) return;
    setProveedorId("");
    setFechaEstimadaEntrega("");
    setNotas("");
    setFilas([{ productoId: "", cantidad: "" }]);
    setPdf(null);
    setValidationError("");
    setNuevoProveedor("");
  }, [open]);

  if (!open) return null;

  const message = validationError || error;

  const setFila = (index, key, value) => {
    setFilas((current) =>
      current.map((fila, i) => (i === index ? { ...fila, [key]: value } : fila)),
    );
    setValidationError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!proveedorId) {
      setValidationError("Seleccioná un proveedor.");
      queueFocusFormError({
        errors: { proveedorId: true },
        root: document.querySelector('[role="dialog"]'),
      });
      return;
    }
    const detalles = filas
      .map((fila) => ({
        productoId: fila.productoId,
        cantidadSolicitada: Number(fila.cantidad),
      }))
      .filter((d) => d.productoId && Number.isFinite(d.cantidadSolicitada) && d.cantidadSolicitada > 0);

    if (detalles.length === 0) {
      setValidationError("Agregá al menos un producto con cantidad entera mayor a 0.");
      queueFocusFormError({
        errors: { productoId: true, cantidad: true },
        root: document.querySelector('[role="dialog"]'),
        fieldOrder: ["productoId", "cantidad"],
      });
      return;
    }
    if (pdf) {
      if (pdf.type && pdf.type !== "application/pdf" && !pdf.name?.toLowerCase().endsWith(".pdf")) {
        setValidationError("La proforma debe ser un PDF.");
        queueFocusFormError({
          errors: { proforma: true },
          root: document.querySelector('[role="dialog"]'),
        });
        return;
      }
      if (pdf.size > MAX_PDF_BYTES) {
        setValidationError("El PDF no puede superar 5 MB.");
        queueFocusFormError({ root: document.querySelector('[role="dialog"]') });
        return;
      }
    }

    await onSave({
      proveedorId,
      fechaEstimadaEntrega: fechaEstimadaEntrega || undefined,
      notas: (await asegurarCamposEnEspanol({ notas: notas.trim() }, ["notas"])).notas,
      detalles,
      proformaFile: pdf || undefined,
    });
  };

  const handleCrearProveedor = async () => {
    const nombre = nuevoProveedor.trim();
    if (nombre.length < 2) {
      setValidationError("El nombre del proveedor debe tener al menos 2 caracteres.");
      return;
    }
    setCreandoProveedor(true);
    setValidationError("");
    try {
      const paraGuardar = await asegurarCamposEnEspanol({ nombre }, ["nombre"]);
      const creado = await onCrearProveedor(paraGuardar);
      if (creado?.id) setProveedorId(creado.id);
      setNuevoProveedor("");
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "No se pudo crear el proveedor.");
    } finally {
      setCreandoProveedor(false);
    }
  };

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="solicitud-compra-title">
      <AdminModalHeader>
        <h2 id="solicitud-compra-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
          <ST>Nueva solicitud de compra</ST>
        </h2>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={t("Cerrar")}>
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
            <ST>Proveedor</ST>
            <select
              name="proveedorId"
              className={fieldClass}
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              required
            >
              <option value="">{tSeleccionar}</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{t(p.nombre)}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <input
              className={`${fieldClass} min-w-[12rem] flex-1`}
              placeholder={tNuevoProveedor}
              value={nuevoProveedor}
              onChange={(e) => setNuevoProveedor(e.target.value)}
            />
            <button
              type="button"
              onClick={handleCrearProveedor}
              disabled={creandoProveedor}
              className="inline-flex min-h-[var(--control-height)] items-center rounded-full border border-slate-200 px-4 text-[length:var(--text-body)] font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {creandoProveedor ? tCreando : tAgregarProveedor}
            </button>
          </div>

          <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
            <ST>Fecha estimada de entrega</ST>
            <input type="date" className={fieldClass} value={fechaEstimadaEntrega} onChange={(e) => setFechaEstimadaEntrega(e.target.value)} />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[length:var(--text-body)] font-medium text-slate-700"><ST>Ítems</ST></p>
              <button
                type="button"
                className="inline-flex min-h-[var(--control-height)] items-center gap-1 rounded-full border border-slate-200 px-3 text-[length:var(--text-body)] font-semibold"
                onClick={() => setFilas((c) => [...c, { productoId: "", cantidad: "" }])}
              >
                <Plus className="size-4" /> <ST>Agregar ítem</ST>
              </button>
            </div>
            {filas.map((fila, index) => (
              <div key={`fila-${index}`} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                <select
                  name={index === 0 ? "productoId" : undefined}
                  className={fieldClass}
                  value={fila.productoId}
                  onChange={(e) => setFila(index, "productoId", e.target.value)}
                >
                  <option value="">{tProducto}</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{t(p.nombre)}</option>
                  ))}
                </select>
                <NumericInput
                  name={index === 0 ? "cantidad" : undefined}
                  className={fieldClass}
                  placeholder={tCantidad}
                  value={fila.cantidad}
                  onChange={(e) => setFila(index, "cantidad", e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex min-h-[var(--control-height)] items-center justify-center rounded-full border border-slate-200 px-3 text-slate-600 disabled:opacity-40"
                  disabled={filas.length <= 1}
                  onClick={() => setFilas((c) => c.filter((_, i) => i !== index))}
                  aria-label={t("Quitar fila")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
            <ST>Proforma PDF (máx. 5 MB)</ST>
            <span className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-600">
              <FileUp className="size-4 shrink-0" />
              <input
                name="proforma"
                type="file"
                accept="application/pdf,.pdf"
                className="w-full text-[length:var(--text-body)] file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1 file:text-white"
                onChange={(e) => setPdf(e.target.files?.[0] || null)}
              />
            </span>
          </label>

          <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
            <ST>Notas</ST>
            <textarea
              className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[length:var(--text-body)] outline-none focus:border-slate-400 focus:bg-white"
              value={notas}
              onChange={conLimitePalabras((e) => setNotas(e.target.value), MAX_PALABRAS_NOTAS)}
            />
            <ContadorPalabras value={notas} maxPalabras={MAX_PALABRAS_NOTAS} />
          </label>

          {message ? (
            <p className="text-[length:var(--text-body)] text-red-600" role="alert"><ST>{message}</ST></p>
          ) : null}

          <div className="border-t border-slate-100 pt-4">
            <AdminModalActions
              onCancel={onClose}
              primaryLabel={isSaving ? "Guardando…" : "Crear solicitud"}
              primaryDisabled={isSaving}
            />
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}

function DetalleModal({ open, solicitud, onClose }) {
  const [proformaError, setProformaError] = useState("");
  const tSolicitud = useTraducir("Solicitud");

  const handleDescargarProforma = async (event) => {
    event.preventDefault();
    if (!solicitud) return;
    setProformaError("");
    try {
      const blob = await descargarProformaAutenticada(solicitud.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proforma-solicitud-${solicitud.id}.pdf`;
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setProformaError(error?.message || "No se pudo descargar la proforma.");
    }
  };

  if (!open || !solicitud) return null;
  const tieneProforma = Boolean(solicitud.urlProformaPdf);

  return (
    <AdminModal open onClose={onClose} maxWidth="max-w-xl" labelledBy="solicitud-detalle-title">
      <AdminModalHeader>
        <h2 id="solicitud-detalle-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
          {tSolicitud} #{solicitud.id}
        </h2>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={t("Cerrar")}>
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>
        <div className="space-y-4 text-[length:var(--text-body)] text-slate-700">
          <p><span className="font-semibold text-slate-900"><ST>Proveedor:</ST></span> {solicitud.proveedorNombre ? <ST>{solicitud.proveedorNombre}</ST> : "—"}</p>
          <p><span className="font-semibold text-slate-900"><ST>Estado:</ST></span> <ST>{solicitud.estado}</ST></p>
          <p><span className="font-semibold text-slate-900"><ST>Entrega estimada:</ST></span> {formatFecha(solicitud.fechaEstimadaEntrega)}</p>
          {solicitud.notas ? <p><span className="font-semibold text-slate-900"><ST>Notas:</ST></span> <ST>{solicitud.notas}</ST></p> : null}
          {tieneProforma ? (
            <p>
              <span className="font-semibold text-slate-900"><ST>Proforma:</ST> </span>
              <button
                type="button"
                className="text-sky-700 underline"
                onClick={handleDescargarProforma}
              >
                <ST>Descargar PDF</ST>
              </button>
            </p>
          ) : (
            <p><ST>Sin proforma adjunta.</ST></p>
          )}
          {proformaError ? (
            <p className="text-red-600" role="alert"><ST>{proformaError}</ST></p>
          ) : null}
          <div>
            <p className="mb-2 font-semibold text-slate-900"><ST>Ítems</ST></p>
            <ul className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              {(solicitud.detalles || []).map((d) => (
                <li key={d.id || `${d.productoId}-${d.cantidadSolicitada}`}>
                  {d.productoNombre ? <ST>{d.productoNombre}</ST> : `Producto ${d.productoId}`} — {d.cantidadSolicitada}
                </li>
              ))}
            </ul>
          </div>
          {(solicitud.historialEstados || []).length > 0 ? (
            <div>
              <p className="mb-2 font-semibold text-slate-900"><ST>Historial de estados</ST></p>
              <ul className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                {solicitud.historialEstados.map((h, i) => (
                  <li key={`${h.estado}-${h.fecha || i}`}>
                    <ST>{h.estado}</ST> · {formatFecha(h.fecha)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </AdminModalBody>
    </AdminModal>
  );
}

export default function AdminSolicitudesCompra() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer = tienePermiso(roles, "ver_inventario");
  const puedeGestionar = tienePermiso(roles, "ajustar_stock_ubicaciones");
  const puedeCrearProveedor = tienePermiso(roles, "agregar_productor");

  const [solicitudes, setSolicitudes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [status, setStatus] = useState("idle");
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [accionId, setAccionId] = useState("");

  const load = async () => {
    setStatus("loading");
    setLoadError("");
    try {
      const [lista, provs, catalogo] = await Promise.all([
        obtenerSolicitudesCompra(),
        obtenerProveedores({ incluirInactivos: false }),
        obtenerCatalogoProductos(),
      ]);
      setSolicitudes(lista);
      setProveedores(provs);
      setProductos(
        (catalogo || []).filter((p) => String(p.estado || "") !== "Deshabilitado"),
      );
      setStatus("success");
    } catch (error) {
      setSolicitudes([]);
      setStatus("error");
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las solicitudes.");
    }
  };

  useEffect(() => {
    if (puedeVer) load();
    else setStatus("success");
  }, [puedeVer]);

  const ready = !puedeVer || status !== "idle";
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/solicitudes-compra", ready);

  const filters = useAdminListaFiltros(solicitudes, {
    buscarEn: (item) => [item.id, item.proveedorNombre, item.estado, item.notas],
    filtrosConfig: [
      {
        id: "estado",
        valorInicial: "todos",
        aplicar: (lista, valor) => {
          if (!valor || valor === "todos") return lista;
          return lista.filter((item) => item.estado === valor);
        },
      },
      {
        id: "proveedorId",
        valorInicial: "todos",
        aplicar: (lista, valor) => {
          if (!valor || valor === "todos") return lista;
          return lista.filter((item) => String(item.proveedorId) === String(valor));
        },
      },
    ],
  });

  const {
    page,
    setPage,
    pageItems,
    totalPages,
  } = useAdminPaginacion(filters.filtrados);

  const proveedorOptions = useMemo(
    () => proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    [proveedores],
  );

  const handleCrear = async (payload) => {
    setIsSaving(true);
    setFormError("");
    setSuccessMessage("");
    try {
      await crearSolicitudCompra(payload);
      setFormOpen(false);
      setSuccessMessage("Solicitud creada.");
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear la solicitud.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEstado = async (id, estado) => {
    setAccionId(id);
    setSuccessMessage("");
    try {
      await cambiarEstadoSolicitudCompra(id, estado);
      setSuccessMessage(
        estado === "aprobada"
          ? `Solicitud #${id} aprobada.`
          : `Solicitud #${id} marcada como recibida.`,
      );
      await load();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
    } finally {
      setAccionId("");
    }
  };

  const handleVerDetalle = async (id) => {
    try {
      const full = await obtenerSolicitudCompra(id);
      setDetalle(full);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar el detalle.");
    }
  };

  return (
    <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage} allowed={puedeVer}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[length:var(--text-title)] font-bold text-slate-950"><ST>Solicitudes de compra</ST></h1>
              <p className="mt-1 text-[length:var(--text-body)] text-slate-600">
                <ST>Generá solicitudes internas, adjuntá proformas y registrá la entrada de stock al recibir.</ST>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={load}
                className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-200 px-4 text-[length:var(--text-body)] font-semibold text-slate-800 hover:bg-slate-50"
              >
                <RefreshCw className="size-4" /> <ST>Actualizar</ST>
              </button>
              {puedeGestionar ? (
                <button
                  type="button"
                  onClick={() => { setFormError(""); setFormOpen(true); }}
                  className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full bg-slate-950 px-4 text-[length:var(--text-body)] font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="size-4" /> <ST>Nueva solicitud</ST>
                </button>
              ) : null}
            </div>
          </div>

          {successMessage ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[length:var(--text-body)] text-emerald-800">
              <CheckCircle2 className="size-4" /> <ST>{successMessage}</ST>
            </p>
          ) : null}
          {loadError ? (
            <p className="text-[length:var(--text-body)] text-red-600" role="alert"><ST>{loadError}</ST></p>
          ) : null}

          <AdminListaToolbar
            busqueda={filters.busqueda}
            onBusquedaChange={filters.setBusqueda}
            placeholder="Buscar por proveedor, estado o notas…"
            total={filters.total}
            visibles={filters.visibles}
            hayFiltrosActivos={filters.hayFiltrosActivos}
            onLimpiar={filters.limpiar}
            filtros={[
              {
                id: "estado",
                label: "Estado",
                value: filters.valoresFiltro.estado || "todos",
                onChange: (v) => filters.setValorFiltro("estado", v),
                opciones: ESTADOS.map((e) => ({
                  value: e.value || "todos",
                  label: e.label,
                })),
              },
              {
                id: "proveedorId",
                label: "Proveedor",
                value: filters.valoresFiltro.proveedorId || "todos",
                onChange: (v) => filters.setValorFiltro("proveedorId", v),
                opciones: [
                  { value: "todos", label: "Todos" },
                  ...proveedorOptions,
                ],
              },
            ]}
          />

          {status === "error" && !solicitudes.length ? (
            <AdminListaVacia mensaje={loadError || "No se pudieron cargar las solicitudes."} />
          ) : filters.filtrados.length === 0 ? (
            <AdminListaVacia mensaje="No hay solicitudes con esos filtros." />
          ) : (
            <>
              <div className="admin-table-shell overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-[length:var(--text-body)]">
                  <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold"><ST>Creación</ST></th>
                      <th className="px-4 py-3 font-semibold"><ST>Proveedor</ST></th>
                      <th className="px-4 py-3 font-semibold"><ST>Ítems</ST></th>
                      <th className="px-4 py-3 font-semibold"><ST>Entrega est.</ST></th>
                      <th className="px-4 py-3 font-semibold"><ST>Estado</ST></th>
                      <th className="px-4 py-3 font-semibold"><ST>Acciones</ST></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3">{formatFecha(item.creadoEn)}</td>
                        <td className="px-4 py-3">{item.proveedorNombre ? <ST>{item.proveedorNombre}</ST> : "—"}</td>
                        <td className="px-4 py-3">{item.detalles?.length || item.cantidadItems || 0}</td>
                        <td className="px-4 py-3">{formatFecha(item.fechaEstimadaEntrega)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 font-semibold capitalize ${badgeEstado(item.estado)}`}>
                            <ST>{item.estado}</ST>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="inline-flex min-h-[var(--control-height)] items-center gap-1 rounded-full border border-slate-200 px-3 font-semibold hover:bg-slate-50"
                              onClick={() => handleVerDetalle(item.id)}
                            >
                              <Eye className="size-4" /> <ST>Ver detalle</ST>
                            </button>
                            {puedeGestionar && item.estado === "pendiente" ? (
                              <button
                                type="button"
                                disabled={accionId === item.id}
                                className="inline-flex min-h-[var(--control-height)] items-center rounded-full bg-sky-600 px-3 font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                                onClick={() => handleEstado(item.id, "aprobada")}
                              >
                                <ST>Aprobar</ST>
                              </button>
                            ) : null}
                            {puedeGestionar && item.estado === "aprobada" ? (
                              <button
                                type="button"
                                disabled={accionId === item.id}
                                className="inline-flex min-h-[var(--control-height)] items-center rounded-full bg-emerald-700 px-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                                onClick={() => handleEstado(item.id, "recibida")}
                              >
                                <ST>Marcar como recibida</ST>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPaginacion
                page={page}
                totalPages={totalPages}
                total={filters.filtrados.length}
                onChange={setPage}
                label="Paginación de solicitudes de compra"
              />
            </>
          )}
        </div>

        <SolicitudFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleCrear}
          isSaving={isSaving}
          error={formError}
          proveedores={proveedores}
          productos={productos}
          onCrearProveedor={async (payload) => {
            if (!puedeCrearProveedor) {
              throw new Error("No tenés permiso para agregar proveedores.");
            }
            const creado = await crearProveedor(payload);
            setProveedores((current) => [...current, creado].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
            return creado;
          }}
        />
        <DetalleModal open={Boolean(detalle)} solicitud={detalle} onClose={() => setDetalle(null)} />
      </AdminLayout>
    </AdminPageGate>
  );
}
