import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, Plus, Send, Store, X } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../Components/Admin/ui/AdminModal";
import { UiSelect } from "../../../Components/ui/Select";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useInventoryLocations } from "../../../hooks/useInventoryLocations";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import {
  limpiarInventarioUbicacionCache,
  obtenerCatalogoProductos,
  obtenerStockPorUbicacion,
} from "../../../services/productosService";
import {
  crearTransferencia,
  obtenerHistorialTransferencias,
} from "../../../services/transferenciasService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { queueFocusFormError } from "../../../lib/formFocus";
import {
  ContadorPalabras,
} from "../../../Components/Admin/ui/CampoLimitePalabras";
import {
  conLimitePalabras,
  MAX_PALABRAS_NOTAS,
} from "../../../lib/formLimits";
import { ST } from "../../../Components/T/ST";
import { t } from "../../../lib/t";
import { useIdioma } from "../../../lib/useIdioma";
import { asegurarCamposEnEspanol } from "../../../lib/traducir";

const fieldClass =
  "min-h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

function formatFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-CR");
}

export default function AdminDistribucion() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer = tienePermiso(roles, "ver_inventario");
  const puedeTransferir = tienePermiso(roles, "ajustar_stock_ubicaciones");

  const { data: puntosVenta, loading: loadingPos } = useInventoryLocations({ enabled: puedeVer });

  const [productos, setProductos] = useState([]);
  const [stockCentral, setStockCentral] = useState(new Map());
  const [productoId, setProductoId] = useState("");
  const [destinoCodigo, setDestinoCodigo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [notas, setNotas] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [catalogStatus, setCatalogStatus] = useState("idle");
  const [catalogError, setCatalogError] = useState("");
  const [historial, setHistorial] = useState([]);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("todos");
  const [histStatus, setHistStatus] = useState("idle");
  const [histError, setHistError] = useState("");
  const pageSize = 20;
  const { idioma } = useIdioma();

  const stockDisponible = useMemo(() => {
    if (!productoId) return null;
    const val = stockCentral.get(String(productoId));
    return val === undefined ? 0 : val;
  }, [productoId, stockCentral]);

  const cantidadNum = Number(cantidad);
  const cantidadInvalida =
    !Number.isFinite(cantidadNum) ||
    !Number.isInteger(cantidadNum) ||
    cantidadNum <= 0 ||
    (stockDisponible !== null && cantidadNum > stockDisponible);

  const opcionesProducto = useMemo(
    () => [
      { value: "", label: t("Seleccionar…") },
      ...productos.map((p) => ({
        value: String(p.id),
        label: t(p.nombre || `Producto ${p.id}`),
      })),
    ],
    [productos, idioma],
  );

  const opcionesDestino = useMemo(
    () => [
      { value: "", label: t("Seleccionar…") },
      ...puntosVenta.map((pos) => ({
        value: pos.code,
        label: t(pos.name || pos.code),
      })),
    ],
    [puntosVenta, idioma],
  );

  const productoSeleccionado = useMemo(
    () => productos.find((p) => String(p.id) === String(productoId)),
    [productos, productoId],
  );

  const destinoSeleccionado = useMemo(
    () => puntosVenta.find((p) => p.code === destinoCodigo),
    [puntosVenta, destinoCodigo],
  );

  const loadCatalogoYStock = async () => {
    setCatalogStatus("loading");
    setCatalogError("");
    try {
      const [catalogo, stock] = await Promise.all([
        obtenerCatalogoProductos(),
        obtenerStockPorUbicacion("BODEGA_CENTRAL"),
      ]);
      setProductos(
        (catalogo || []).filter((p) => String(p.estado || "") !== "Deshabilitado"),
      );
      const map = new Map();
      for (const row of stock || []) {
        map.set(String(row.productId), Number(row.stock) || 0);
      }
      setStockCentral(map);
      setCatalogStatus("success");
    } catch (error) {
      setProductos([]);
      setStockCentral(new Map());
      setCatalogStatus("error");
      setCatalogError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el catálogo o el stock.",
      );
    }
  };

  const loadHistorial = async (pageOverride = page, overrides = {}) => {
    setHistStatus("loading");
    setHistError("");
    const fDesde = overrides.fechaDesde !== undefined ? overrides.fechaDesde : fechaDesde;
    const fHasta = overrides.fechaHasta !== undefined ? overrides.fechaHasta : fechaHasta;
    const fDestino = overrides.filtroDestino !== undefined ? overrides.filtroDestino : filtroDestino;
    try {
      const data = await obtenerHistorialTransferencias({
        fechaDesde: fDesde || undefined,
        fechaHasta: fHasta || undefined,
        ubicacionDestino: fDestino !== "todos" ? fDestino : undefined,
        page: pageOverride,
        pageSize,
      });
      setHistorial(data.items);
      setHistorialTotal(data.total);
      setPage(data.page);
      setHistStatus("success");
    } catch (error) {
      setHistorial([]);
      setHistorialTotal(0);
      setHistStatus("error");
      setHistError(
        error instanceof Error ? error.message : "No se pudo cargar el historial.",
      );
    }
  };

  useEffect(() => {
    if (!puedeVer) return;
    loadCatalogoYStock();
    loadHistorial(1);
  }, [puedeVer]);

  const ready =
    !puedeVer || (!loadingPos && histStatus !== "idle" && catalogStatus !== "idle");
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/distribucion", ready);

  const totalPages = Math.max(1, Math.ceil(historialTotal / pageSize));

  const historialFiltrado = useMemo(() => {
    if (!busqueda.trim()) return historial;
    const q = busqueda.toLowerCase().trim();
    return historial.filter(
      (item) =>
        (item.productoNombre && item.productoNombre.toLowerCase().includes(q)) ||
        (item.destinoNombre && item.destinoNombre.toLowerCase().includes(q)) ||
        (item.destinoCodigo && item.destinoCodigo.toLowerCase().includes(q)) ||
        (item.responsableNombre && item.responsableNombre.toLowerCase().includes(q)) ||
        (item.notas && item.notas.toLowerCase().includes(q)) ||
        String(item.id).includes(q),
    );
  }, [historial, busqueda]);

  const totalUnidadesPagina = useMemo(
    () => historialFiltrado.reduce((acc, row) => acc + (Number(row.cantidad) || 0), 0),
    [historialFiltrado],
  );

  const limpiarFormulario = () => {
    setProductoId("");
    setDestinoCodigo("");
    setCantidad("");
    setNotas("");
    setFormError("");
  };

  const abrirConfirmacion = (event) => {
    event.preventDefault();
    setFormError("");
    if (!productoId) {
      setFormError("Seleccioná un producto.");
      queueFocusFormError({
        errors: { productoId: true },
        root: event.currentTarget,
        fieldMap: { productoId: "distribucion-producto" },
      });
      return;
    }
    if (!destinoCodigo) {
      setFormError("Seleccioná el punto de venta destino.");
      queueFocusFormError({
        errors: { ubicacionDestino: true },
        root: event.currentTarget,
        fieldMap: { ubicacionDestino: "distribucion-destino" },
      });
      return;
    }
    if (cantidadInvalida) {
      setFormError(
        stockDisponible === 0
          ? "No hay stock disponible en Bodega Central para ese producto."
          : `La cantidad debe ser un entero entre 1 y ${stockDisponible}.`,
      );
      queueFocusFormError({
        errors: { cantidad: true },
        root: event.currentTarget,
      });
      return;
    }
    setConfirmOpen(true);
  };

  const ejecutarTransferencia = async () => {
    setIsSaving(true);
    setFormError("");
    try {
      const notasTrim = notas.trim();
      const notasEs = notasTrim
        ? (await asegurarCamposEnEspanol({ notas: notasTrim }, ["notas"])).notas
        : undefined;
      await crearTransferencia({
        productoId,
        cantidad: cantidadNum,
        ubicacionDestino: destinoCodigo,
        notas: notasEs,
      });
      limpiarInventarioUbicacionCache();
      setConfirmOpen(false);
      setFormOpen(false);
      setSuccessMessage(
        `Se distribuyeron ${cantidadNum} unidades de ${productoSeleccionado?.nombre || "producto"} a ${destinoSeleccionado?.name || destinoCodigo}.`,
      );
      limpiarFormulario();
      await loadCatalogoYStock();
      await loadHistorial(1);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No se pudo completar la distribución.",
      );
      setConfirmOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage} allowed={puedeVer}>
      <AdminLayout>
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-[length:var(--text-title)] font-semibold text-slate-900">
                    <ST>Distribución a puntos de venta</ST>
                  </h1>
                  <p className="mt-1 text-[length:var(--text-body)] text-slate-500">
                    <ST>Trasladá unidades desde Bodega Central hacia los puntos de venta, con historial de transferencias.</ST>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {puedeTransferir ? (
                    <button
                      type="button"
                      onClick={() => { setFormError(""); setFormOpen(true); }}
                      className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-full bg-slate-900 px-4 text-[length:var(--text-body)] font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Plus className="size-4" /> <ST>Nueva distribución</ST>
                    </button>
                  ) : null}
                </div>
              </div>

              {successMessage ? (
                <div
                  className="mt-3 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[length:var(--text-body)] font-medium text-emerald-800"
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <ST>{successMessage}</ST>
                </div>
              ) : null}

              {catalogError ? (
                <div
                  className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[length:var(--text-body)] font-medium text-red-700"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <ST>{catalogError}</ST>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 border-b border-slate-100 px-4 py-4 sm:grid-cols-3 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-500">
                  <ST>Transferencias</ST>
                </p>
                <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-slate-950">
                  {historialTotal}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 sm:col-span-2">
                <p className="text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-slate-700">
                  <ST>Unidades distribuidas</ST>
                </p>
                <p className="mt-1 text-[length:var(--text-subtitle)] font-semibold text-slate-900">
                  {totalUnidadesPagina}
                </p>
              </div>
            </div>

            <AdminListaToolbar
              busqueda={busqueda}
              onBusquedaChange={(valor) => setBusqueda(valor)}
              placeholder="Buscar por producto, destino, responsable o notas..."
              total={historialTotal}
              visibles={historialFiltrado.length}
              hayFiltrosActivos={Boolean(busqueda || fechaDesde || fechaHasta || (filtroDestino && filtroDestino !== "todos"))}
              onLimpiar={() => {
                setBusqueda("");
                setFechaDesde("");
                setFechaHasta("");
                setFiltroDestino("todos");
                setPage(1);
                loadHistorial(1, { fechaDesde: "", fechaHasta: "", filtroDestino: "todos" });
              }}
              filtros={[
                {
                  id: "desde",
                  label: "Desde",
                  tipo: "fecha",
                  value: fechaDesde,
                  onChange: (v) => {
                    setFechaDesde(v);
                    setPage(1);
                    loadHistorial(1, { fechaDesde: v });
                  },
                },
                {
                  id: "hasta",
                  label: "Hasta",
                  tipo: "fecha",
                  value: fechaHasta,
                  onChange: (v) => {
                    setFechaHasta(v);
                    setPage(1);
                    loadHistorial(1, { fechaHasta: v });
                  },
                },
                {
                  id: "destino",
                  label: "Destino",
                  value: filtroDestino,
                  onChange: (v) => {
                    setFiltroDestino(v);
                    setPage(1);
                    loadHistorial(1, { filtroDestino: v });
                  },
                  opciones: [
                    { value: "todos", label: "Todos" },
                    ...puntosVenta.map((p) => ({
                      value: p.code,
                      label: p.name || p.code,
                    })),
                  ],
                },
              ]}
            />

            {histError ? (
              <div className="p-4">
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[length:var(--text-body)] font-medium text-red-700" role="alert">
                  <ST>{histError}</ST>
                </div>
              </div>
            ) : null}

            {histStatus === "loading" ? (
              <div className="px-4 py-14 text-center text-[length:var(--text-body)] text-slate-500">
                <ST>Cargando transferencias...</ST>
              </div>
            ) : historialFiltrado.length === 0 ? (
              <AdminListaVacia
                onLimpiar={() => {
                  setBusqueda("");
                  setFechaDesde("");
                  setFechaHasta("");
                  setFiltroDestino("todos");
                  setPage(1);
                  loadHistorial(1);
                }}
              />
            ) : (
              <div className="admin-table-shell">
                <table className="w-full min-w-[860px] text-left text-[length:var(--text-body)]">
                  <thead>
                    <tr>
                      <th><ST>Fecha</ST></th>
                      <th><ST>Producto</ST></th>
                      <th><ST>Cantidad</ST></th>
                      <th><ST>Destino</ST></th>
                      <th><ST>Responsable</ST></th>
                      <th><ST>Notas</ST></th>
                      <th><ST>Acciones</ST></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatFechaHora(row.fecha)}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {row.productoNombre ? <ST>{row.productoNombre}</ST> : row.productoId}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                            {row.cantidad} {t("unid.")}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <Store className="size-4 text-slate-400" aria-hidden="true" />
                            {row.destinoNombre ? <ST>{row.destinoNombre}</ST> : row.destinoCodigo}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{row.responsableNombre || "—"}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {row.notas ? <ST>{row.notas}</ST> : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setDetalle(row)}
                            className="inline-flex h-[var(--control-height)] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50"
                            aria-label={`${t("Ver detalle")} ${row.id}`}
                          >
                            <Eye className="size-4" /> <ST>Ver</ST>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {historialTotal > 0 && totalPages > 0 ? (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6">
                <p className="text-[length:var(--text-body)] text-slate-600">
                  <ST>Página</ST> {page} <ST>de</ST> {totalPages} · {historialTotal} <ST>registros</ST>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => { const p = page - 1; setPage(p); loadHistorial(p); }}
                    className="h-[var(--control-height)] rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ST>Anterior</ST>
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => { const p = page + 1; setPage(p); loadHistorial(p); }}
                    className="h-[var(--control-height)] rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ST>Siguiente</ST>
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* Modal: Formulario Nueva Distribución */}
        <AdminModal open={formOpen} onClose={() => setFormOpen(false)} maxWidth="max-w-xl" labelledBy="distribucion-form-title">
          <AdminModalHeader>
            <h2 id="distribucion-form-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
              <ST>Nueva distribución</ST>
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label={t("Cerrar")}
            >
              <X className="size-5" />
            </button>
          </AdminModalHeader>
          <AdminModalBody>
            <form onSubmit={abrirConfirmacion} className="space-y-4" noValidate>
              <div className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                <ST>Producto</ST>
                <input type="hidden" name="productoId" value={productoId} />
                <UiSelect
                  id="distribucion-producto"
                  ariaLabel={t("Producto")}
                  value={productoId}
                  onChange={setProductoId}
                  options={opcionesProducto}
                />
                {productoId ? (
                  <div className="mt-1 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-[length:var(--text-body)] text-slate-700">
                    <span><ST>Stock en Bodega Central:</ST></span>
                    <span className="font-bold text-slate-900">
                      {stockDisponible === null ? "—" : `${stockDisponible} ${t("unidades")}`}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                <ST>Punto de venta destino</ST>
                <input type="hidden" name="ubicacionDestino" value={destinoCodigo} />
                <UiSelect
                  id="distribucion-destino"
                  ariaLabel={t("Punto de venta destino")}
                  value={destinoCodigo}
                  onChange={setDestinoCodigo}
                  options={opcionesDestino}
                />
              </div>

              <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                <ST>Cantidad</ST>
                <NumericInput
                  name="cantidad"
                  className={fieldClass}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                />
              </label>

              <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                <ST>Notas (opcional)</ST>
                <textarea
                  className="min-h-[var(--control-height)] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0"
                  value={notas}
                  onChange={conLimitePalabras((e) => setNotas(e.target.value), MAX_PALABRAS_NOTAS)}
                />
                <ContadorPalabras value={notas} maxPalabras={MAX_PALABRAS_NOTAS} />
              </label>

              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[length:var(--text-body)] font-medium text-red-700" role="alert">
                  <ST>{formError}</ST>
                </div>
              ) : null}

              <div className="flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-[var(--control-height)] items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-[length:var(--text-body)] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="size-4" aria-hidden="true" />
                  <ST>Confirmar distribución</ST>
                </button>
              </div>
            </form>
          </AdminModalBody>
        </AdminModal>

        {/* Modal: Confirmación de Distribución */}
        <AdminModal open={confirmOpen} onClose={() => !isSaving && setConfirmOpen(false)} maxWidth="max-w-xl" labelledBy="confirm-dist-title">
          <AdminModalHeader>
            <h2 id="confirm-dist-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
              <ST>Confirmar distribución</ST>
            </h2>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setConfirmOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label={t("Cerrar")}
            >
              <X className="size-5" />
            </button>
          </AdminModalHeader>
          <AdminModalBody>
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[length:var(--text-body)]">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-medium text-slate-500"><ST>Producto</ST></span>
                <span className="font-semibold text-slate-900">{productoSeleccionado?.nombre ? <ST>{productoSeleccionado.nombre}</ST> : "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-medium text-slate-500"><ST>Cantidad</ST></span>
                <span className="font-bold text-slate-900">{cantidadNum} <ST>unidades</ST></span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-medium text-slate-500"><ST>Origen</ST></span>
                <span className="font-medium text-slate-900"><ST>Bodega Central</ST></span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-medium text-slate-500"><ST>Destino</ST></span>
                <span className="font-semibold text-slate-900">{destinoSeleccionado?.name ? <ST>{destinoSeleccionado.name}</ST> : destinoCodigo}</span>
              </div>
              {notas.trim() ? (
                <div className="flex flex-col gap-1 pt-1">
                  <span className="font-medium text-slate-500"><ST>Notas</ST></span>
                  <p className="rounded-xl border border-slate-200/60 bg-white p-2.5 text-xs text-slate-800">{notas.trim()}</p>
                </div>
              ) : null}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <AdminModalActions
                onCancel={() => setConfirmOpen(false)}
                primaryType="button"
                onPrimary={ejecutarTransferencia}
                primaryLabel={isSaving ? t("Procesando…") : t("Confirmar")}
                primaryDisabled={isSaving}
              />
            </div>
          </AdminModalBody>
        </AdminModal>

        {/* Modal: Detalle de Transferencia */}
        {detalle ? (
          <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-xl" labelledBy="distribucion-detalle-title">
            <AdminModalHeader>
              <h2 id="distribucion-detalle-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-900">
                <ST>Transferencia</ST> #{detalle.id}
              </h2>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label={t("Cerrar")}
              >
                <X className="size-5" />
              </button>
            </AdminModalHeader>
            <AdminModalBody>
              <dl className="grid gap-2 text-[length:var(--text-body)]">
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Fecha y hora</ST></dt>
                  <dd className="font-medium text-slate-900">{formatFechaHora(detalle.fecha)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Producto</ST></dt>
                  <dd className="font-semibold text-slate-900">
                    {detalle.productoNombre ? <ST>{detalle.productoNombre}</ST> : detalle.productoId}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Cantidad</ST></dt>
                  <dd className="font-bold text-slate-900">
                    {detalle.cantidad} <ST>unidades</ST>
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Origen</ST></dt>
                  <dd className="font-medium text-slate-900"><ST>Bodega Central</ST></dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Destino</ST></dt>
                  <dd className="font-medium text-slate-900">
                    {detalle.destinoNombre ? <ST>{detalle.destinoNombre}</ST> : detalle.destinoCodigo}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-100 py-2">
                  <dt className="text-slate-500"><ST>Responsable</ST></dt>
                  <dd className="font-medium text-slate-900">{detalle.responsableNombre || "—"}</dd>
                </div>
                {detalle.notas ? (
                  <div className="flex flex-col gap-1 py-2">
                    <dt className="text-slate-500"><ST>Notas</ST></dt>
                    <dd className="rounded-xl border border-slate-200/60 bg-slate-50 p-2.5 text-xs text-slate-800">
                      <ST>{detalle.notas}</ST>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </AdminLayout>
    </AdminPageGate>
  );
}


