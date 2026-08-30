import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Plus, RefreshCw } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminLayout } from "../layouts/AdminLayout";
import { categoriasUnicas, filtrarPorCategoria } from "../../../lib/categorias";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useInventoryLocations } from "../../../hooks/useInventoryLocations";
import { useLocationStock } from "../../../hooks/useLocationStock";
import { useProductCatalog } from "../../../hooks/useProductCatalog";
import {
  actualizarUbicacion,
  ajustarStockPorUbicacion,
  crearUbicacion,
} from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { ST } from "../../../Components/T/ST";
import { PointOfSaleCards } from "./components/PointOfSaleCards";
import { PointOfSaleLocationEditor } from "./components/PointOfSaleLocationEditor";
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
  const [locationEditor, setLocationEditor] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [togglingCode, setTogglingCode] = useState("");

  const effectiveSelectedCode = locationsState.data.some((location) => location.code === selectedCode)
    ? selectedCode
    : locationsState.data[0]?.code || "";
  const selectedLocation = locationsState.data.find((location) => location.code === effectiveSelectedCode) || null;
  const selectedIsActive = selectedLocation?.activo !== false;
  const stockState = useLocationStock(effectiveSelectedCode, {
    enabled: puedeVer && Boolean(effectiveSelectedCode) && selectedIsActive,
  });

  const products = useMemo(() => catalogState.data.map((product) => ({
    ...product,
    stockRecord: stockState.data.find((stock) => String(stock.productId) === String(product.id)),
  })), [catalogState.data, stockState.data]);
  const stockByProductId = useMemo(() => new Map(products.map((product) => [String(product.id), product.stockRecord])), [products]);
  const categoriasProducto = useMemo(() => categoriasUnicas(products), [products]);
  const buscarEn = useCallback((product) => [product.nombre, product.descripcion, product.estado, product.peso, product.categoria], []);
  const filters = useAdminListaFiltros(products, {
    buscarEn,
    filtrosConfig: [
      {
        id: "categoria",
        aplicar: (lista, valor) => filtrarPorCategoria(lista, valor === "todos" ? "todas" : valor),
      },
      { id: "estado", obtenerValor: (product) => product.estado },
    ],
  });
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

  const handleSaveLocation = async (payload) => {
    setIsSavingLocation(true);
    setLocationError("");
    setSuccessMessage("");
    try {
      if (locationEditor?.code) {
        const actualizada = await actualizarUbicacion(locationEditor.code, { nombre: payload.nombre });
        setSuccessMessage(`Se actualizó ${actualizada.name}.`);
      } else {
        const creada = await crearUbicacion(payload);
        setSelectedCode(creada.code);
        setSuccessMessage(`Se agregó ${creada.name}.`);
      }
      setLocationEditor(null);
      await locationsState.retry();
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "No se pudo guardar el punto de venta.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleToggleActivo = async (location) => {
    setTogglingCode(location.code);
    setSuccessMessage("");
    try {
      const nextActivo = location.activo === false;
      const actualizada = await actualizarUbicacion(location.code, { activo: nextActivo });
      await locationsState.retry();
      setSuccessMessage(
        nextActivo
          ? `${actualizada.name} quedó activo.`
          : `${actualizada.name} quedó inhabilitado.`,
      );
      if (!nextActivo && selectedCode === location.code) {
        setSelectedProduct(null);
      }
    } catch (error) {
      setSuccessMessage("");
      setLocationError(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
    } finally {
      setTogglingCode("");
    }
  };

  const content = !puedeVer ? (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-slate-950"><ST>Acceso restringido</ST></h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500"><ST>No tienes permiso para consultar el inventario de puntos de venta.</ST></p>
    </section>
  ) : locationsState.loading || catalogState.loading ? (
    <section className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <span className="admin-route-loading__spinner" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-600"><ST>Cargando puntos de venta...</ST></p>
    </section>
  ) : locationsState.error ? (
    <section className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-white px-5 text-center">
      <p className="text-sm font-semibold text-red-700">{locationsState.error.message}</p>
      <button type="button" onClick={locationsState.retry} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-800 bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
        <RefreshCw className="size-4" aria-hidden="true" />
        <ST>Reintentar</ST>
      </button>
    </section>
  ) : locationsState.data.length === 0 && !puedeEditar ? (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
      <p className="text-sm text-slate-500"><ST>No hay puntos de venta configurados.</ST></p>
    </section>
  ) : (
    <section className="space-y-5">
      {puedeEditar ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setLocationError("");
              setLocationEditor({ mode: "create" });
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Plus className="size-4" aria-hidden="true" />
            <ST>Agregar punto de venta</ST>
          </button>
        </div>
      ) : null}
      {locationsState.data.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
          <p className="text-sm text-slate-500"><ST>Todavía no hay puntos de venta. Agregá el primero para operar stock por ubicación.</ST></p>
        </section>
      ) : (
        <PointOfSaleCards
          locations={locationsState.data}
          selectedCode={effectiveSelectedCode}
          onSelect={(code) => {
            setSelectedCode(code);
            setSuccessMessage("");
            setLocationError("");
            setSelectedProduct(null);
          }}
          canManage={puedeEditar}
          onEdit={(location) => {
            setLocationError("");
            setLocationEditor(location);
          }}
          onToggleActivo={handleToggleActivo}
          togglingCode={togglingCode}
        />
      )}
      {selectedLocation ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500"><ST>Inventario por ubicación</ST></p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">{selectedLocation.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedIsActive
                  ? <ST>Stock independiente de Bodega Central.</ST>
                  : <ST>Este punto está inhabilitado. Activalo para consultar o ajustar stock.</ST>}
              </p>
            </div>
            {selectedIsActive && stockState.error ? (
              <button type="button" onClick={stockState.retry} className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                <RefreshCw className="size-4" aria-hidden="true" />
                <ST>Reintentar stock</ST>
              </button>
            ) : null}
          </div>
          {!selectedIsActive ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-500"><ST>No se opera inventario en puntos inactivos.</ST></p>
            </div>
          ) : catalogState.error ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold text-red-600">{catalogState.error.message}</p>
              <button type="button" onClick={catalogState.retry} className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"><ST>Reintentar catálogo</ST></button>
            </div>
          ) : stockState.error ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-semibold text-red-600">{stockState.error.message}</p>
            </div>
          ) : (
            <>
              <AdminListaToolbar
                busqueda={filters.busqueda}
                onBusquedaChange={filters.setBusqueda}
                placeholder="Buscar por nombre, descripción, categoría, estado o peso..."
                total={filters.total}
                visibles={filters.visibles}
                hayFiltrosActivos={filters.hayFiltrosActivos}
                onLimpiar={filters.limpiar}
                filtros={[
                  {
                    id: "categoria",
                    label: "Categoría",
                    value: filters.valoresFiltro.categoria || "todos",
                    onChange: (valor) => filters.setValorFiltro("categoria", valor),
                    opciones: [{ value: "todos", label: "Todas" }, ...categoriasProducto.map((categoria) => ({ value: categoria, label: categoria }))],
                  },
                  {
                    id: "estado",
                    label: "Estado",
                    value: filters.valoresFiltro.estado || "todos",
                    onChange: (valor) => filters.setValorFiltro("estado", valor),
                    opciones: [
                      { value: "todos", label: "Todos" },
                      { value: "Habilitado", label: "Habilitado" },
                      { value: "Deshabilitado", label: "Deshabilitado" },
                    ],
                  },
                ]}
              />
              {filters.filtrados.length === 0 ? (
                <AdminListaVacia onLimpiar={filters.limpiar} />
              ) : (
                <PointOfSaleStockTable
                  products={filters.filtrados}
                  stockByProductId={stockByProductId}
                  stockLoading={stockState.loading}
                  canEdit={puedeEditar}
                  onEdit={setSelectedProduct}
                />
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6">
          <header>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800"><ST>Inventario</ST></p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl"><ST>Puntos de venta</ST></h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              <ST>Administrá ubicaciones y actualizá el stock de cada punto sin mezclarlo con Bodega Central.</ST>
            </p>
          </header>
          {successMessage ? (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status" aria-live="polite">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {successMessage}
            </div>
          ) : null}
          {locationError && !locationEditor ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
              {locationError}
            </div>
          ) : null}
          {content}
          <PointOfSaleStockEditor
            key={`${selectedProduct?.id || "closed"}-${selectedProduct?.stockRecord?.stock ?? "none"}`}
            open={Boolean(selectedProduct)}
            location={selectedLocation}
            product={selectedProduct}
            stockRecord={selectedProduct ? stockByProductId.get(String(selectedProduct.id)) : null}
            onSave={handleSave}
            onClose={() => {
              setSelectedProduct(null);
              setSaveError("");
            }}
            isSaving={isSaving}
            error={saveError}
          />
          <PointOfSaleLocationEditor
            key={locationEditor?.code || locationEditor?.mode || "closed"}
            open={Boolean(locationEditor)}
            location={locationEditor?.code ? locationEditor : null}
            onClose={() => {
              setLocationEditor(null);
              setLocationError("");
            }}
            onSave={handleSaveLocation}
            isSaving={isSavingLocation}
            error={locationError}
          />
        </div>
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminPuntosVenta;
