import { useEffect, useState } from "react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { limpiarProductosCache, obtenerProductos } from "../../../services/productosService";
import { obtenerMotivosSalida, registrarSalidaInventario } from "../../../services/inventarioSalidasService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { SalidaInventarioForm } from "./SalidaInventarioForm";

const ROUTE_PATH = "/admin/salidas-inventario";

function getStockCentral(producto) {
  if (producto?.centralStock) {
    return producto.centralStock.confidence === "known" ? producto.centralStock.stock : null;
  }
  return Number(producto?.stockCentral ?? producto?.stock);
}

export default function AdminSalidasInventario() {
  const actor = getActiveSessionUser();
  const puedeRegistrarSalida = tienePermiso(
    rolesDeUsuario(actor),
    "ajustar_stock_ubicaciones",
  );
  const [productos, setProductos] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const { showLoading, loadingMessage } = useAdminPageGate(
    ROUTE_PATH,
    !puedeRegistrarSalida || !isLoading,
  );

  useEffect(() => {
    if (!puedeRegistrarSalida) return undefined;
    let active = true;

    Promise.all([
        obtenerProductos(),
        obtenerMotivosSalida(),
    ])
      .then(([catalogo, motivosSalida]) => {
        if (!active) return;
        setProductos(Array.isArray(catalogo) ? catalogo : []);
        setMotivos(motivosSalida);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar la información de inventario.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [puedeRegistrarSalida, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError("");
    setRetryCount((count) => count + 1);
  };

  const handleSubmit = async (payload) => {
    setIsSaving(true);
    setSuccessMessage("");
    try {
      await registrarSalidaInventario(payload);
      limpiarProductosCache();
      setProductos((current) => current.map((producto) => {
        if (String(producto.id) !== String(payload.productoId)) return producto;
        const stock = getStockCentral(producto);
        if (!Number.isInteger(stock)) return producto;
        return { ...producto, stock: stock - payload.cantidad };
      }));
      setSuccessMessage("La salida de inventario se registró correctamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPageGate
      showLoading={showLoading}
      message={loadingMessage}
      allowed={puedeRegistrarSalida}
    >
      <AdminLayout>
        <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Manejo de inventario</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Registrar salida de bodega</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Registrá la salida de productos de Bodega Central indicando el motivo y, cuando corresponda, a quién se entrega.
            </p>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Datos de la salida</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Solo aparecen productos habilitados con existencias disponibles.</p>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-sm text-slate-500" role="status" aria-live="polite">Cargando productos y motivos…</div>
            ) : loadError ? (
              <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                <p role="alert">{loadError}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="min-h-10 rounded-full border border-red-300 px-4 py-2 font-semibold transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-red-800 dark:hover:bg-red-950"
                >
                  Reintentar
                </button>
              </div>
            ) : motivos.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100" role="status">
                No hay motivos de salida disponibles. Volvé a intentarlo más tarde.
              </p>
            ) : (
              <>
                {successMessage ? (
                  <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" role="status" aria-live="polite">
                    {successMessage}
                  </p>
                ) : null}
                <SalidaInventarioForm
                  productos={productos}
                  motivos={motivos}
                  onSubmit={handleSubmit}
                  isSubmitting={isSaving}
                />
              </>
            )}
          </section>
        </main>
      </AdminLayout>
    </AdminPageGate>
  );
}
