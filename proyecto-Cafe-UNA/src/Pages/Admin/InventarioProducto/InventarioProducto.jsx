import { useMemo, useState } from "react";



import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { ProductActions } from "./components/ProductActions";
import { CentralStockEditor } from "./components/CentralStockEditor";
import { ProductCatalogFormDrawer } from "./components/ProductCatalogFormDrawer";
import { ProductCatalogMobileList } from "./components/ProductCatalogMobileList";
import { ProductCatalogTable } from "./components/ProductCatalogTable";
import { etiquetaEstadoProducto } from "./components/catalogFormatters";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useCentralStock } from "../../../hooks/useCentralStock";
import { useProductCatalog } from "../../../hooks/useProductCatalog";
import {
  actualizarProducto,
  actualizarStockCentral,
  crearProducto,
} from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { contactSupportMessage } from "../../../lib/formLimits";
import {
  productoPuedeDestacarse,
  productoPuedeDeshabilitarse,
  productoEstaDeshabilitado,
} from "../../../lib/productoDisponibilidad";

const MAX_PRODUCTOS_DESTACADOS = 3;

function contarDestacados(productos, excluirId = null) {
  return productos.filter((item) => item.esDestacado && item.id !== excluirId).length;
}

const AdminInventarioProducto = () => {
  const actor = (() => {
    try {
      return getActiveSessionUser();
    } catch {
      return null;
    }
  })();
  const actorRoles = rolesDeUsuario(actor);
  const puedeCrear = tienePermiso(actorRoles, "crear_productos");
  const puedeEditar = tienePermiso(actorRoles, "actualizar_productos");
  const puedeInactivar = tienePermiso(actorRoles, "inactivar_productos");
  const puedeActualizarStock = tienePermiso(actorRoles, "actualizar_stock_productos");
  const [modalCrear, setModalCrear] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [productoStockEditar, setProductoStockEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardandoStock, setGuardandoStock] = useState(false);
  const catalogState = useProductCatalog();
  const stockState = useCentralStock();
  const stockByProductId = useMemo(
    () => new Map(stockState.data.map((stock) => [String(stock.productId), stock])),
    [stockState.data],
  );
  const productos = useMemo(
    () => catalogState.data.map((producto) => ({
      ...producto,
      centralStock: stockByProductId.get(String(producto.id)) || {
        productId: String(producto.id),
        locationCode: "BODEGA_CENTRAL",
        stock: null,
        confidence: "unknown",
      },
      stock: stockByProductId.get(String(producto.id))?.stock ?? 0,
    })),
    [catalogState.data, stockByProductId],
  );
  const cargando = catalogState.loading;
  const error = catalogState.error?.message || null;
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/producto', !cargando);

  const {
    busqueda,
    setBusqueda,
    filtrados: productosFiltrados,
    limpiar,
    hayFiltrosActivos,
    total,
    visibles,
  } = useAdminListaFiltros(productos, {
    buscarEn: (producto) => [
      producto.nombre,
      producto.descripcion,
      producto.estado,
      producto.peso,
      etiquetaEstadoProducto(producto).texto,
      producto.esDestacado ? "destacado" : "",
    ],
  });

  const cargarProductos = () => catalogState.retry();

  const handleCrear = async (form) => {
    setGuardando(true);
    try {
      await crearProducto(form);
      await Promise.all([catalogState.retry(), stockState.retry()]);
      setModalCrear(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async (form) => {
    setGuardando(true);
    try {
      await actualizarProducto(productoEditar.id, form);
      await Promise.all([catalogState.retry(), stockState.retry()]);
      setProductoEditar(null);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarStock = async (stock) => {
    setGuardandoStock(true);
    try {
      await actualizarStockCentral(productoStockEditar.id, stock);
      await Promise.all([catalogState.retry(), stockState.retry()]);
      setProductoStockEditar(null);
    } finally {
      setGuardandoStock(false);
    }
  };


  const handleToggleEstado = async (producto) => {
    if (!puedeInactivar) {
      alert("No tiene permiso para habilitar o inhabilitar productos.");
      return;
    }

    const nuevoEstado = producto.estado === "Deshabilitado" ? "Habilitado" : "Deshabilitado";

    if (nuevoEstado === "Deshabilitado" && !productoPuedeDeshabilitarse(producto)) {
      alert("Quita el producto de destacados antes de deshabilitarlo.");
      return;
    }

    try {
      await actualizarProducto(producto.id, {
        ...producto,
        estado: nuevoEstado,
      });
      await catalogState.retry();
    } catch (err) {
      alert(err?.message || "No se pudo cambiar el estado del producto.");
    }
  };

  const handleToggleDestacado = async (producto) => {
    if (!producto.esDestacado) {
      if (contarDestacados(productos) >= MAX_PRODUCTOS_DESTACADOS) {
        alert(`Solo puedes destacar hasta ${MAX_PRODUCTOS_DESTACADOS} productos en el inicio.`);
        return;
      }

      if (!productoPuedeDestacarse(producto)) {
        if (productoEstaDeshabilitado(producto)) {
          alert("No puedes destacar un producto deshabilitado.");
        } else {
          alert("No puedes destacar un producto sin stock.");
        }
        return;
      }
    }

    try {
      await actualizarProducto(producto.id, {
        esDestacado: !producto.esDestacado,
      });
      await catalogState.retry();
    } catch (err) {
      alert(err?.message || "No se pudo cambiar el estado destacado.");
    }
  };

  const destacadosEnUso = contarDestacados(productos);

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
    <AdminLayout>
      <ProductCatalogFormDrawer
        open={modalCrear || Boolean(productoEditar)}
        initial={productoEditar}
        products={productos}
        onSave={productoEditar ? handleEditar : handleCrear}
        onClose={() => {
          setModalCrear(false);
          setProductoEditar(null);
        }}
        isSaving={guardando}
      />

      <CentralStockEditor
        key={`${productoStockEditar?.id ?? "closed"}-${productoStockEditar?.centralStock?.confidence ?? "unknown"}-${productoStockEditar?.centralStock?.stock ?? ""}`}
        open={Boolean(productoStockEditar)}
        product={productoStockEditar}
        stockRecord={productoStockEditar?.centralStock}
        onSave={handleGuardarStock}
        onClose={() => setProductoStockEditar(null)}
        isSaving={guardandoStock}
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 py-14 text-center sm:px-6">
            <span className="admin-route-loading__spinner" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 py-14 text-center sm:px-6">
            <p className="max-w-md text-sm font-semibold text-red-600">{error}</p>
            <p className="max-w-md text-xs text-slate-500">{contactSupportMessage()}</p>
            <button
              type="button"
              onClick={cargarProductos}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
        {stockState.error ? (
          <div className="flex flex-col gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-6" role="status">
            <span>El catálogo está disponible, pero no se pudo cargar el stock de Bodega Central.</span>
            <button
              type="button"
              onClick={stockState.retry}
              className="min-h-11 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Reintentar stock
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">Productos</h1>
            <p className="mt-1 text-sm text-slate-500">{"Administraci\u00f3n de inventario"}</p>
            <p className="mt-1 text-xs text-slate-400">
              Destacados en inicio: {destacadosEnUso}/{MAX_PRODUCTOS_DESTACADOS}
            </p>
          </div>

          {puedeCrear ? (
          <button
            type="button"
            onClick={() => setModalCrear(true)}
            className="w-full rounded-full bg-amber-900 px-5 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 sm:w-auto"
          >
            + Nuevo producto
          </button>
          ) : null}
        </div>

        {!cargando && !error && productos.length > 0 ? (
          <AdminListaToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder={"Buscar por nombre, descripci\u00f3n, estado o peso..."}
            total={total}
            visibles={visibles}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiar={limpiar}
          />
        ) : null}

        {productos.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-slate-500 sm:px-6">No hay productos registrados.</div>
        ) : productosFiltrados.length === 0 ? (
          <AdminListaVacia onLimpiar={limpiar} />
        ) : (
          <>
            <ProductCatalogTable
              productos={productosFiltrados}
              destacadosEnUso={destacadosEnUso}
              maxDestacados={MAX_PRODUCTOS_DESTACADOS}
              puedeDestacarse={productoPuedeDestacarse}
              stockLoading={stockState.loading}
              onToggleDestacado={handleToggleDestacado}
              renderAcciones={(producto) => (
                <ProductActions
                  producto={producto}
                  puedeEditar={puedeEditar}
                  puedeInactivar={puedeInactivar}
                  puedeActualizarStock={puedeActualizarStock}
                  onEditar={() => setProductoEditar(producto)}
                  onToggleEstado={() => handleToggleEstado(producto)}
                  onEditarStock={() => setProductoStockEditar(producto)}
                />
              )}
            />
            <ProductCatalogMobileList
              productos={productosFiltrados}
              destacadosEnUso={destacadosEnUso}
              maxDestacados={MAX_PRODUCTOS_DESTACADOS}
              puedeDestacarse={productoPuedeDestacarse}
              stockLoading={stockState.loading}
              onToggleDestacado={handleToggleDestacado}
              renderAcciones={(producto) => (
                <ProductActions
                  producto={producto}
                  puedeEditar={puedeEditar}
                  puedeInactivar={puedeInactivar}
                  puedeActualizarStock={puedeActualizarStock}
                  variant="mobile"
                  onEditar={() => setProductoEditar(producto)}
                  onToggleEstado={() => handleToggleEstado(producto)}
                  onEditarStock={() => setProductoStockEditar(producto)}
                />
              )}
            />
          </>
        )}
          </>
        )}
      </section>
    </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminInventarioProducto;
