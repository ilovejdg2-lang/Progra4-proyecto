import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useInventoryLocations } from "../../../hooks/useInventoryLocations";
import { useLocationStock } from "../../../hooks/useLocationStock";
import { useProductCatalog } from "../../../hooks/useProductCatalog";
import { ajustarStockPorUbicacion } from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { PointOfSaleCards } from "./components/PointOfSaleCards";
import { PointOfSaleStockEditor } from "./components/PointOfSaleStockEditor";
import { PointOfSaleStockTable } from "./components/PointOfSaleStockTable";

const AdminPuntosVenta = () => {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer = tienePermiso(roles, "ver_inventario");
  const puedeEditar = tienePermiso(roles, "ajustar_stock_ubicaciones");
  const locationsState = useInventoryLocations({ enabled: puedeVer });
  const catalogState = useProductCatalog({ enabled: puedeVer });
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const effectiveSelectedCode = locationsState.data.some((location) => location.code === selectedCode)
    ? selectedCode
    : locationsState.data[0]?.code || "";
  const selectedLocation = locationsState.data.find((location) => location.code === effectiveSelectedCode) || null;
  const stockState = useLocationStock(effectiveSelectedCode, { enabled: puedeVer && Boolean(effectiveSelectedCode) });

  const products = useMemo(() => catalogState.data.map((product) => ({
    ...product,
    stockRecord: stockState.data.find((stock) => String(stock.productId) === String(product.id)),
  })), [catalogState.data, stockState.data]);
  const stockByProductId = useMemo(() => new Map(products.map((product) => [String(product.id), product.stockRecord])), [products]);
  const buscarEn = useCallback((product) => [product.nombre, product.descripcion, product.estado, product.peso], []);
  const filters = useAdminListaFiltros(products, { buscarEn });
  const ready = !puedeVer || (locationsState.status !== "idle" && catalogState.status !== "idle");
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/puntos-venta", ready);

  const handleSave = async (stock, reason) => {
    setIsSaving(true);
    setSaveError("");
    setSuccessMessage("");
    try {
      await ajustarStockPorUbicacion(effectiveSelectedCode, selectedProduct.id, stock, reason);
      await stockState.retry();
      setSelectedProduct(null);
      setSuccessMessage(`Stock de ${selectedProduct.nombre} actualizado en ${selectedLocation.name}.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar el ajuste.");
    } finally {
      setIsSaving(false);
    }
  };

  const content = !puedeVer ? (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm"><h1 className="text-xl font-semibold text-slate-950">Acceso restringido</h1><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">No tienes permiso para consultar el inventario de puntos de venta.</p></section>
  ) : locationsState.loading || catalogState.loading ? (
    <section className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm"><span className="admin-route-loading__spinner" aria-hidden="true" /><p className="text-sm font-semibold text-slate-600">Cargando puntos de venta...</p></section>
  ) : locationsState.error ? (
    <section className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-center"><p className="text-sm font-semibold text-amber-900">{locationsState.error.message}</p><button type="button" onClick={locationsState.retry} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"><RefreshCw className="size-4" aria-hidden="true" />Reintentar</button></section>
  ) : locationsState.data.length === 0 ? (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm"><p className="text-sm text-slate-500">No hay puntos de venta configurados.</p></section>
  ) : (
    <section className="space-y-5">
      <PointOfSaleCards locations={locationsState.data} selectedCode={effectiveSelectedCode} onSelect={(code) => { setSelectedCode(code); setSuccessMessage(""); }} />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Inventario por ubicación</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{selectedLocation?.name}</h2><p className="mt-1 text-sm text-slate-500">Stock independiente de Bodega Central.</p></div>{stockState.error ? <button type="button" onClick={stockState.retry} className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"><RefreshCw className="size-4" aria-hidden="true" />Reintentar stock</button> : null}</div>
        {catalogState.error ? <div className="px-5 py-8 text-center"><p className="text-sm font-semibold text-red-600">{catalogState.error.message}</p><button type="button" onClick={catalogState.retry} className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Reintentar catálogo</button></div> : stockState.error ? <div className="px-5 py-8 text-center"><p className="text-sm font-semibold text-red-600">{stockState.error.message}</p></div> : <><AdminListaToolbar busqueda={filters.busqueda} onBusquedaChange={filters.setBusqueda} placeholder="Buscar por nombre, descripción, estado o peso..." total={filters.total} visibles={filters.visibles} hayFiltrosActivos={filters.hayFiltrosActivos} onLimpiar={filters.limpiar} />{filters.filtrados.length === 0 ? <AdminListaVacia onLimpiar={filters.limpiar} /> : <PointOfSaleStockTable products={filters.filtrados} stockByProductId={stockByProductId} stockLoading={stockState.loading} canEdit={puedeEditar} onEdit={setSelectedProduct} />}</>}
      </div>
    </section>
  );

  return <AdminPageGate showLoading={showLoading} message={loadingMessage}><AdminLayout><div className="mx-auto max-w-7xl space-y-6"><header><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">Inventario</p><h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">Puntos de venta</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Consulta y actualiza el stock de cada ubicación sin mezclarlo con Bodega Central.</p></header>{successMessage ? <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status" aria-live="polite"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{successMessage}</div> : null}{content}<PointOfSaleStockEditor key={`${selectedProduct?.id || "closed"}-${selectedProduct?.stockRecord?.stock ?? "none"}`} open={Boolean(selectedProduct)} location={selectedLocation} product={selectedProduct} stockRecord={selectedProduct ? stockByProductId.get(String(selectedProduct.id)) : null} onSave={handleSave} onClose={() => { setSelectedProduct(null); setSaveError(""); }} isSaving={isSaving} error={saveError} /></div></AdminLayout></AdminPageGate>;
};

export default AdminPuntosVenta;
