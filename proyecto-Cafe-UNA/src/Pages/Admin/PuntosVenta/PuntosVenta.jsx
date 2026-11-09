import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, Plus, PowerOff, RefreshCw } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
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
import { AdminPageHeader } from "../../../Components/Admin/ui/AdminPageHeader";
import { PointOfSaleLocationEditor } from "./components/PointOfSaleLocationEditor";
import { PointOfSaleLocationHeader } from "./components/PointOfSaleLocationHeader";
import { PointOfSaleLocationSelector } from "./components/PointOfSaleLocationSelector";
import { LOCATION_PILLS_MAX, locationTabId } from "./components/locationSelectorConfig";
import { PointOfSaleStockEditor } from "./components/PointOfSaleStockEditor";
import { PointOfSaleStockTable } from "./components/PointOfSaleStockTable";
import { PointOfSaleToolbar } from "./components/PointOfSaleToolbar";

// No overflow-hidden here: the selector popover and the overflow menu must be able to extend past a short panel.
const panelCls = "@container min-w-0 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]";
const mutedText = "text-[length:var(--text-body)] text-[color:var(--admin-text-muted)]";
const quietBtnCls =
  "admin-role-quiet inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[length:var(--text-body)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus-ring)]";

const AdminPuntosVenta = () => {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puedeVer =
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ver_ventas");
  const puedeEditar = tienePermiso(roles, "ver_inventario") && tienePermiso(roles, "ajustar_stock_ubicaciones");
  const soloAsignados = !tienePermiso(roles, "ver_inventario");
  const locationsState = useInventoryLocations({ enabled: puedeVer });
  const catalogState = useProductCatalog({ enabled: puedeVer });
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [locationEditor, setLocationEditor] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [successToken, setSuccessToken] = useState(0);
  const [successShown, setSuccessShown] = useState(false);
  const anunciarExito = (mensaje) => {
    setSuccessToken((token) => token + 1);
    setSuccessMessage(mensaje);
  };
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [togglingCode, setTogglingCode] = useState("");
  const tabsBaseId = useId();
  const headingRef = useRef(null);
  const [focusCheck, setFocusCheck] = useState(0);
  const panelId = `${tabsBaseId}-panel`;

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
  // Totals count catalog products with stock above zero; nothing is derived while loading or on error.
  const locationTotals = useMemo(() => {
    if (stockState.status !== "success") return { productCount: null, unitCount: null };
    const catalogIds = new Set(catalogState.data.map((product) => String(product.id)));
    const tracked = stockState.data.filter(
      (record) => catalogIds.has(String(record.productId)) && record.stock !== null && record.stock !== undefined && Number(record.stock) > 0,
    );
    return {
      productCount: tracked.length,
      unitCount: tracked.reduce((sum, record) => sum + Number(record.stock), 0),
    };
  }, [catalogState.data, stockState.data, stockState.status]);
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
  useEffect(() => {
    if (!successMessage) {
      setSuccessShown(false);
      return undefined;
    }
    setSuccessShown(false);
    const enter = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSuccessShown(true));
    });
    const hide = setTimeout(() => setSuccessShown(false), 3000);
    const clear = setTimeout(() => setSuccessMessage(""), 3550);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(hide);
      clearTimeout(clear);
    };
  }, [successMessage, successToken]);

  // After a refetch the control that opened a flow may be gone; keep keyboard focus inside the panel.
  useEffect(() => {
    if (!focusCheck) return undefined;
    const timer = setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body || !active.isConnected) headingRef.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [focusCheck]);

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
      anunciarExito(`Stock de ${selectedProduct.nombre} actualizado en ${selectedLocation.name}.`);
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
      const presentacion = {
        nombre: payload.nombre,
        imagenUrl: payload.imagenUrl || null,
        imagenes: payload.imagenes || [],
        direccion: payload.direccion || null,
        telefono: payload.telefono || null,
        horario: payload.horario || null,
        mapsUrl: payload.mapsUrl || null,
      };
      if (locationEditor?.code) {
        const actualizada = await actualizarUbicacion(locationEditor.code, presentacion);
        anunciarExito(`Se actualizó ${actualizada.name}.`);
      } else {
        const creada = await crearUbicacion({ ...presentacion, codigo: payload.codigo });
        setSelectedCode(creada.code);
        anunciarExito(`Se agregó ${creada.name}.`);
      }
      setLocationEditor(null);
      await locationsState.retry();
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "No se pudo guardar el punto de venta.");
    } finally {
      setIsSavingLocation(false);
      setFocusCheck((token) => token + 1);
    }
  };

  const handleToggleActivo = async (location) => {
    setTogglingCode(location.code);
    setSuccessMessage("");
    try {
      const nextActivo = location.activo === false;
      const actualizada = await actualizarUbicacion(location.code, { activo: nextActivo });
      await locationsState.retry();
      anunciarExito(
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
      setFocusCheck((token) => token + 1);
    }
  };

  const openCreate = () => {
    setLocationError("");
    setLocationEditor({ mode: "create" });
  };

  const sinUbicaciones = locationsState.data.length === 0;
  const usesPills = locationsState.data.length <= LOCATION_PILLS_MAX;
  const mostrarAgregar =
    puedeVer &&
    puedeEditar &&
    !locationsState.loading &&
    !catalogState.loading &&
    !locationsState.error &&
    !(sinUbicaciones && soloAsignados);

  const messagePanel = (children) => (
    <section className={`${panelCls} px-5 py-14 text-center`}>{children}</section>
  );

  const detailBody = !selectedLocation ? null : !selectedIsActive ? (
    <div className="flex items-start gap-3 bg-[var(--admin-surface-subtle)] px-4 py-6 sm:px-6">
      <PowerOff className="mt-0.5 size-5 shrink-0 text-[color:var(--admin-text-muted)]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-[color:var(--admin-text-primary)]"><ST>Este punto está inactivo</ST></p>
        <p className={`mt-0.5 ${mutedText}`}>
          {puedeEditar ? <ST>Activalo desde el menú para consultar o ajustar su stock.</ST> : <ST>No se opera inventario en puntos inactivos.</ST>}
        </p>
      </div>
    </div>
  ) : catalogState.error ? (
    <div className="px-5 py-10 text-center">
      <p className="text-[length:var(--text-body)] font-semibold text-[color:var(--admin-status-danger-text)]"><ST>{catalogState.error.message}</ST></p>
      <button type="button" onClick={catalogState.retry} className={`${quietBtnCls} mt-3`}>
        <RefreshCw className="size-4" aria-hidden="true" />
        <ST>Reintentar catálogo</ST>
      </button>
    </div>
  ) : stockState.error ? (
    <div className="px-5 py-10 text-center">
      <p className="text-[length:var(--text-body)] font-semibold text-[color:var(--admin-status-danger-text)]"><ST>{stockState.error.message}</ST></p>
      <button type="button" onClick={stockState.retry} className={`${quietBtnCls} mt-3`}>
        <RefreshCw className="size-4" aria-hidden="true" />
        <ST>Reintentar stock</ST>
      </button>
    </div>
  ) : catalogState.data.length === 0 ? (
    <div className="px-5 py-12 text-center">
      <p className={mutedText}><ST>Todavía no hay productos en el catálogo.</ST></p>
    </div>
  ) : (
    <>
      <PointOfSaleToolbar
        busqueda={filters.busqueda}
        onBusquedaChange={filters.setBusqueda}
        categoria={filters.valoresFiltro.categoria || "todos"}
        onCategoriaChange={(valor) => filters.setValorFiltro("categoria", valor)}
        categorias={categoriasProducto}
        estado={filters.valoresFiltro.estado || "todos"}
        onEstadoChange={(valor) => filters.setValorFiltro("estado", valor)}
        hayFiltrosActivos={filters.hayFiltrosActivos}
        total={filters.total}
        visibles={filters.visibles}
        onLimpiar={filters.limpiar}
      />
      <div className="border-t border-[var(--admin-border)]">
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
      </div>
    </>
  );

  const content = !puedeVer ? (
    messagePanel(
      <>
        <h1 className="text-xl font-semibold text-[color:var(--admin-text-primary)]!"><ST>Acceso restringido</ST></h1>
        <p className={`mx-auto mt-2 max-w-md ${mutedText}`}><ST>No tienes permiso para consultar el inventario de puntos de venta.</ST></p>
      </>,
    )
  ) : locationsState.loading || catalogState.loading ? (
    <section className={`${panelCls} flex min-h-[360px] flex-col items-center justify-center gap-3`}>
      <span className="admin-route-loading__spinner" aria-hidden="true" />
      <p className={`font-semibold ${mutedText}`}><ST>Cargando puntos de venta...</ST></p>
    </section>
  ) : locationsState.error ? (
    <section className={`${panelCls} flex min-h-[360px] flex-col items-center justify-center gap-3 px-5 text-center`}>
      <p className="text-[length:var(--text-body)] font-semibold text-[color:var(--admin-status-danger-text)]"><ST>{locationsState.error.message}</ST></p>
      <button type="button" onClick={locationsState.retry} className={quietBtnCls}>
        <RefreshCw className="size-4" aria-hidden="true" />
        <ST>Reintentar</ST>
      </button>
    </section>
  ) : sinUbicaciones && soloAsignados ? (
    messagePanel(<p className={mutedText}><ST>No tienes puntos de venta asignados. Contacta a un administrador.</ST></p>)
  ) : sinUbicaciones && !puedeEditar ? (
    messagePanel(<p className={mutedText}><ST>No hay puntos de venta configurados.</ST></p>)
  ) : sinUbicaciones ? (
    messagePanel(
      <>
        <p className={`mx-auto mb-5 max-w-md ${mutedText}`}><ST>Todavía no hay puntos de venta. Agregá el primero para operar stock por ubicación.</ST></p>
        <button
          type="button"
          onClick={openCreate}
          className="admin-role-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          <ST>Agregar punto de venta</ST>
        </button>
      </>,
    )
  ) : (
    <section className={panelCls}>
      <PointOfSaleLocationSelector
        locations={locationsState.data}
        selectedCode={effectiveSelectedCode}
        tabsBaseId={tabsBaseId}
        panelId={panelId}
        onSelect={(code) => {
          setSelectedCode(code);
          setSuccessMessage("");
          setLocationError("");
          setSelectedProduct(null);
        }}
      />
      {selectedLocation ? (
        <div
          id={panelId}
          role={usesPills ? "tabpanel" : "region"}
          aria-labelledby={usesPills ? locationTabId(tabsBaseId, effectiveSelectedCode) : undefined}
          aria-label={usesPills ? undefined : selectedLocation.name}
          className="min-w-0 border-t border-[var(--admin-border)]"
        >
          <PointOfSaleLocationHeader
            location={selectedLocation}
            productCount={selectedIsActive ? locationTotals.productCount : null}
            unitCount={selectedIsActive ? locationTotals.unitCount : null}
            canManage={puedeEditar}
            onEdit={(location) => {
              setLocationError("");
              setLocationEditor(location);
            }}
            onToggleActivo={handleToggleActivo}
            toggling={togglingCode === selectedLocation.code}
            headingRef={headingRef}
          />
          <div className="overflow-hidden rounded-b-[calc(1rem-1px)] border-t border-[var(--admin-border)]">{detailBody}</div>
        </div>
      ) : null}
    </section>
  );

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage} allowed={puedeVer}>
      <AdminLayout>
        <div className="min-w-0 space-y-6">
          <AdminPageHeader
            title={<ST>Puntos de venta</ST>}
            description={
              <ST>
                {soloAsignados
                  ? "Consultá el stock y el historial de los puntos de venta que tenés asignados."
                  : "Administrá ubicaciones y el stock de cada punto."}
              </ST>
            }
            actions={
              mostrarAgregar && !sinUbicaciones ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 sm:w-auto sm:shrink-0 admin-role-primary"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <ST>Agregar punto de venta</ST>
                </button>
              ) : null
            }
          />
          {successMessage ? (
            <div
              className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-in-out ${
                successShown ? "grid-rows-[1fr] translate-y-0 opacity-100" : "grid-rows-[0fr] -translate-y-1 opacity-0"
              }`}
              role="status"
              aria-live="polite"
            >
              <div className="overflow-hidden">
                <div className="flex items-start gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-[length:var(--text-body)] font-medium text-[color:var(--admin-text-primary)]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--admin-status-success-text)]" aria-hidden="true" />
                  <ST>{successMessage}</ST>
                </div>
              </div>
            </div>
          ) : null}
          {locationError && !locationEditor ? (
            <div className="rounded-2xl border border-[var(--admin-status-danger-text)] bg-[var(--admin-surface)] px-4 py-3 text-[length:var(--text-body)] font-medium text-[color:var(--admin-status-danger-text)]" role="alert">
              <ST>{locationError}</ST>
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
