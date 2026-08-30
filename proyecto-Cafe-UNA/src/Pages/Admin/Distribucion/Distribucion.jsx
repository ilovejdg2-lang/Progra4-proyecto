import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, X } from "lucide-react";

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
  "min-h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [catalogStatus, setCatalogStatus] = useState("idle");
  const [catalogError, setCatalogError] = useState("");
  const [historial, setHistorial] = useState([]);
  const [historialTotal, setHistorialTotal] = useState(0);
  const [page, setPage] = useState(1);
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

  const loadHistorial = async (pageOverride = page) => {
    setHistStatus("loading");
    setHistError("");
    try {
      const data = await obtenerHistorialTransferencias({
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        ubicacionDestino: filtroDestino !== "todos" ? filtroDestino : undefined,
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
        <div className="space-y-8">
          <div>
            <h1 className="text-[length:var(--text-title)] font-bold text-slate-950">
              <ST>Distribución a puntos de venta</ST>
            </h1>
            <p className="mt-1 text-[length:var(--text-body)] text-slate-600">
              <ST>Trasladá unidades desde Bodega Central hacia los puntos de venta, con historial de transferencias.</ST>
            </p>
          </div>

          {successMessage ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[length:var(--text-body)] text-emerald-800">
              <CheckCircle2 className="size-4" /> <ST>{successMessage}</ST>
            </p>
          ) : null}

          {catalogError ? (
            <p className="text-[length:var(--text-body)] text-red-600" role="alert">
              <ST>{catalogError}</ST>
            </p>
          ) : null}

          {puedeTransferir ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
                <ST>Nueva distribución</ST>
              </h2>
              <form onSubmit={abrirConfirmacion} className="mt-4 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
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
                    <p className="text-[length:var(--text-body)] font-normal text-slate-600">
                      <ST>Stock en Bodega Central:</ST>{" "}
                      <span className="font-semibold text-slate-900">
                        {stockDisponible === null ? "—" : stockDisponible}
                      </span>
                    </p>
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
                    className="min-h-[var(--control-height)] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[length:var(--text-body)] outline-none focus:border-slate-400 focus:bg-white"
                    value={notas}
                    onChange={conLimitePalabras((e) => setNotas(e.target.value), MAX_PALABRAS_NOTAS)}
                  />
                  <ContadorPalabras value={notas} maxPalabras={MAX_PALABRAS_NOTAS} />
                </label>
                {formError ? (
                  <p className="text-[length:var(--text-body)] text-red-600 sm:col-span-2" role="alert"><ST>{formError}</ST></p>
                ) : null}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-[var(--control-height)] w-fit items-center justify-center rounded-full bg-slate-950 px-5 text-[length:var(--text-body)] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                >
                  <ST>Confirmar distribución</ST>
                </button>
              </form>
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
                <ST>Historial de transferencias</ST>
              </h2>
              <button
                type="button"
                onClick={() => loadHistorial(page)}
                className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-200 px-4 text-[length:var(--text-body)] font-semibold text-slate-800 hover:bg-slate-50"
              >
                <RefreshCw className="size-4" /> <ST>Actualizar</ST>
              </button>
            </div>

            <AdminListaToolbar
              ocultarBusqueda
              busqueda=""
              onBusquedaChange={() => {}}
              placeholder=""
              total={historialTotal}
              visibles={historial.length}
              hayFiltrosActivos={Boolean(fechaDesde || fechaHasta || filtroDestino !== "todos")}
              onLimpiar={() => {
                setFechaDesde("");
                setFechaHasta("");
                setFiltroDestino("todos");
                setPage(1);
                loadHistorial(1);
              }}
              filtros={[
                {
                  id: "fechaDesde",
                  label: "Desde",
                  tipo: "fecha",
                  value: fechaDesde,
                  onChange: (v) => setFechaDesde(v),
                },
                {
                  id: "fechaHasta",
                  label: "Hasta",
                  tipo: "fecha",
                  value: fechaHasta,
                  onChange: (v) => setFechaHasta(v),
                },
                {
                  id: "destino",
                  label: "Destino",
                  value: filtroDestino,
                  onChange: (v) => setFiltroDestino(v),
                  opciones: [
                    { value: "todos", label: "Todos" },
                    ...puntosVenta.map((p) => ({
                      value: p.code,
                      label: p.name || p.code,
                    })),
                  ],
                },
              ]}
              extra={
                <button
                  type="button"
                  className="inline-flex min-h-[var(--control-height)] items-center rounded-full bg-slate-900 px-4 text-[length:var(--text-body)] font-semibold text-white"
                  onClick={() => {
                    setPage(1);
                    loadHistorial(1);
                  }}
                >
                  <ST>Aplicar filtros</ST>
                </button>
              }
            />

            {histError ? (
              <p className="text-[length:var(--text-body)] text-red-600" role="alert"><ST>{histError}</ST></p>
            ) : null}

            {histStatus === "error" && !historial.length ? (
              <AdminListaVacia mensaje={histError || "No se pudo cargar el historial."} />
            ) : historial.length === 0 ? (
              <AdminListaVacia mensaje="No hay transferencias con esos filtros." />
            ) : (
              <>
                <div className="admin-table-shell overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-[length:var(--text-body)]">
                    <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold"><ST>Fecha</ST></th>
                        <th className="px-4 py-3 font-semibold"><ST>Producto</ST></th>
                        <th className="px-4 py-3 font-semibold"><ST>Cantidad</ST></th>
                        <th className="px-4 py-3 font-semibold"><ST>Destino</ST></th>
                        <th className="px-4 py-3 font-semibold"><ST>Responsable</ST></th>
                        <th className="px-4 py-3 font-semibold"><ST>Notas</ST></th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((row) => (
                        <tr key={row.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 whitespace-nowrap">{formatFechaHora(row.fecha)}</td>
                          <td className="px-4 py-3">
                            {row.productoNombre ? <ST>{row.productoNombre}</ST> : row.productoId}
                          </td>
                          <td className="px-4 py-3">{row.cantidad}</td>
                          <td className="px-4 py-3">
                            {row.destinoNombre ? <ST>{row.destinoNombre}</ST> : row.destinoCodigo}
                          </td>
                          <td className="px-4 py-3">{row.responsableNombre || "—"}</td>
                          <td className="px-4 py-3">
                            {row.notas ? <ST>{row.notas}</ST> : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-[length:var(--text-body)]">
                  <p className="text-slate-600">
                    <ST>Página</ST> {page} <ST>de</ST> {totalPages} · {historialTotal} <ST>registros</ST>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      className="inline-flex min-h-[var(--control-height)] items-center rounded-full border border-slate-200 px-4 font-semibold disabled:opacity-40"
                      onClick={() => loadHistorial(page - 1)}
                    >
                      <ST>Anterior</ST>
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      className="inline-flex min-h-[var(--control-height)] items-center rounded-full border border-slate-200 px-4 font-semibold disabled:opacity-40"
                      onClick={() => loadHistorial(page + 1)}
                    >
                      <ST>Siguiente</ST>
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <AdminModal open={confirmOpen} onClose={() => !isSaving && setConfirmOpen(false)} maxWidth="max-w-xl" labelledBy="confirm-dist-title">
          <AdminModalHeader>
            <h2 id="confirm-dist-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
              <ST>Confirmar distribución</ST>
            </h2>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setConfirmOpen(false)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label={t("Cerrar")}
            >
              <X className="size-5" />
            </button>
          </AdminModalHeader>
          <AdminModalBody>
            <div className="space-y-2 text-[length:var(--text-body)] text-slate-700">
              <p><span className="font-semibold text-slate-900"><ST>Producto:</ST></span> {productoSeleccionado?.nombre ? <ST>{productoSeleccionado.nombre}</ST> : null}</p>
              <p><span className="font-semibold text-slate-900"><ST>Cantidad:</ST></span> {cantidadNum}</p>
              <p><span className="font-semibold text-slate-900"><ST>Origen:</ST></span> <ST>Bodega Central</ST></p>
              <p><span className="font-semibold text-slate-900"><ST>Destino:</ST></span> {destinoSeleccionado?.name ? <ST>{destinoSeleccionado.name}</ST> : destinoCodigo}</p>
              {notas.trim() ? <p><span className="font-semibold text-slate-900"><ST>Notas:</ST></span> {notas.trim()}</p> : null}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <AdminModalActions
                onCancel={() => setConfirmOpen(false)}
                primaryType="button"
                onPrimary={ejecutarTransferencia}
                primaryLabel={isSaving ? "Procesando…" : "Confirmar"}
                primaryDisabled={isSaving}
              />
            </div>
          </AdminModalBody>
        </AdminModal>
      </AdminLayout>
    </AdminPageGate>
  );
}
