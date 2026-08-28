import { useEffect, useMemo, useState } from "react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { CategoriaNueva, CategoriaOpcionBorrar } from "../../../Components/Admin/ui/CategoriaCampo";
import { ProductActions } from "./components/ProductActions";
import { CentralStockEditor } from "./components/CentralStockEditor";
import { ProductCatalogFormDrawer } from "./components/ProductCatalogFormDrawer";
import { ProductCatalogMobileList } from "./components/ProductCatalogMobileList";
import { ProductCatalogTable } from "./components/ProductCatalogTable";
import { etiquetaEstadoProducto } from "./components/catalogFormatters";
import { categoriasUnicas, esCategoriaRaiz, filtrarPorCategoria, TIPO_CATEGORIA_PRODUCTO } from "../../../lib/categorias";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import { useCentralStock } from "../../../hooks/useCentralStock";
import { useProductCatalog } from "../../../hooks/useProductCatalog";
import {
  actualizarProducto,
  actualizarStockCentral,
  crearProducto,
} from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { obtenerCategorias } from "../../../services/categoriasService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { contactSupportMessage } from "../../../lib/formLimits";
import { ADMIN_STOCK_PRODUCT_EVENT, clearPendingStockProduct, peekPendingStockProduct } from "../../../lib/adminStockAlert";
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
  const esSuperAdmin = actorRoles.map((rol) => String(rol).toLowerCase()).includes("superadmin");
  const puedeInactivar = esSuperAdmin && tienePermiso(actorRoles, "inactivar_productos");
  const puedeActualizarStock = tienePermiso(actorRoles, "actualizar_stock_productos");
  const [modalCrear, setModalCrear] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [productoStockEditar, setProductoStockEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [categoriasApi, setCategoriasApi] = useState([]);
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

  const abrirStockDeProducto = (productId, nombre = "") => {
    if (!puedeActualizarStock || !productId) return false;
    const producto = productos.find((item) => String(item.id) === String(productId));
    setProductoStockEditar(
      producto || {
        id: productId,
        nombre: nombre || "Producto",
        centralStock: {
          productId: String(productId),
          locationCode: "BODEGA_CENTRAL",
          stock: null,
          confidence: "unknown",
        },
        stock: 0,
      },
    );
    return true;
  };

  const abrirStockPendiente = () => {
    const pending = peekPendingStockProduct();
    if (!pending?.productId) return;
    if (abrirStockDeProducto(pending.productId, pending.nombre)) {
      window.setTimeout(() => clearPendingStockProduct(), 500);
    }
  };

  useEffect(() => {
    abrirStockPendiente();
  }, [puedeActualizarStock, productos]);

  useEffect(() => {
    const onOpenStock = () => {
      abrirStockPendiente();
    };

    window.addEventListener(ADMIN_STOCK_PRODUCT_EVENT, onOpenStock);
    return () => window.removeEventListener(ADMIN_STOCK_PRODUCT_EVENT, onOpenStock);
  }, [puedeActualizarStock, productos]);

  const recargarCategorias = () =>
    obtenerCategorias(TIPO_CATEGORIA_PRODUCTO)
      .then((lista) => setCategoriasApi(lista))
      .catch(() => setCategoriasApi([]));

  useEffect(() => {
    recargarCategorias();
  }, []);

  const nombresCategoriasApi = useMemo(
    () => categoriasApi.filter(esCategoriaRaiz).map((item) => item.nombre),
    [categoriasApi],
  );
  const categoriasProducto = useMemo(
    () => categoriasUnicas([...productos, ...nombresCategoriasApi.map((nombre) => ({ categoria: nombre }))]),
    [productos, nombresCategoriasApi],
  );
  const nombresCategoriasEnUso = useMemo(
    () => productos.map((producto) => producto.categoria),
    [productos],
  );
  const puedeAdministrarCategorias = puedeCrear || puedeEditar || puedeInactivar;
  const filtrosConfig = useMemo(
    () => [
      {
        id: "categoria",
        aplicar: (lista, valor) => filtrarPorCategoria(lista, valor === "todos" ? "todas" : valor),
      },
      { id: "estado", obtenerValor: (producto) => producto.estado },
      {
        id: "destacado",
        aplicar: (lista, valor) => {
          if (valor === "si") return lista.filter((producto) => producto.esDestacado);
          if (valor === "no") return lista.filter((producto) => !producto.esDestacado);
          return lista;
        },
      },
    ],
    [],
  );

  const {
    busqueda,
    setBusqueda,
    valoresFiltro,
    setValorFiltro,
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
      producto.categoria,
      producto.subcategoria,
      etiquetaEstadoProducto(producto).texto,
      producto.esDestacado ? "destacado" : "",
    ],
    filtrosConfig,
  });

  const {
    page,
    setPage,
    pageItems: productosPagina,
    totalPages,
    showPagination,
  } = useAdminPaginacion(productosFiltrados);

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
      setProductoStockEditar(null);
      await Promise.all([
        catalogState.retry({ silent: true }),
        stockState.retry({ silent: true }),
      ]);
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

  const stockEditor = (
      <CentralStockEditor
        key={productoStockEditar?.id ?? "closed"}
        open={Boolean(productoStockEditar)}
        product={productoStockEditar}
        stockRecord={productoStockEditar?.centralStock}
        onSave={handleGuardarStock}
        onClose={() => setProductoStockEditar(null)}
        isSaving={guardandoStock}
      />
  );

  return (
    <>
    {stockEditor}
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
    <AdminLayout>
      <ProductCatalogFormDrawer
        key={productoEditar?.id ?? (modalCrear ? "nuevo" : "cerrado")}
        open={modalCrear || Boolean(productoEditar)}
        initial={productoEditar}
        products={productos}
        categorias={categoriasProducto}
        onCategoriaCreada={recargarCategorias}
        onSave={productoEditar ? handleEditar : handleCrear}
        onClose={() => {
          setModalCrear(false);
          setProductoEditar(null);
        }}
        isSaving={guardando}
      />

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
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
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6" role="status">
            <span>El catálogo está disponible, pero no se pudo cargar el stock de Bodega Central.</span>
            <button
              type="button"
              onClick={stockState.retry}
              className="min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
            className="w-full rounded-full border border-slate-950 bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 sm:w-auto"
          >
            + Nuevo producto
          </button>
          ) : null}
        </div>

        {!cargando && !error ? (
          <AdminListaToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder={"Buscar por nombre, descripción, categoría, estado o peso..."}
            total={total}
            visibles={visibles}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiar={limpiar}
            filtros={[
              {
                id: "categoria",
                label: "Categoría",
                value: valoresFiltro.categoria || "todos",
                onChange: (valor) => setValorFiltro("categoria", valor),
                footer: puedeAdministrarCategorias ? (
                  <CategoriaNueva
                    tipo={TIPO_CATEGORIA_PRODUCTO}
                    enMenu
                    onCreada={recargarCategorias}
                    placeholder="Ej. Café de altura"
                  />
                ) : null,
                renderOptionEnd: puedeAdministrarCategorias
                  ? (opcion) =>
                      opcion.id ? (
                        <CategoriaOpcionBorrar
                          categoria={opcion}
                          nombresEnUso={nombresCategoriasEnUso}
                          onEliminada={(nombre) => {
                            recargarCategorias();
                            if ((valoresFiltro.categoria || "").toLowerCase() === String(nombre || "").toLowerCase()) {
                              setValorFiltro("categoria", "todos");
                            }
                          }}
                        />
                      ) : null
                  : undefined,
                opciones: [
                  { value: "todos", label: "Todas" },
                  ...categoriasProducto.map((categoria) => {
                    const registro = categoriasApi.find(
                      (item) =>
                        esCategoriaRaiz(item) &&
                        (item.nombre || "").toLowerCase() === String(categoria).toLowerCase(),
                    );
                    return {
                      value: categoria,
                      label: categoria,
                      id: registro?.id,
                      nombre: categoria,
                      usos: registro?.usos,
                    };
                  }),
                ],
              },
              {
                id: "estado",
                label: "Estado",
                value: valoresFiltro.estado || "todos",
                onChange: (valor) => setValorFiltro("estado", valor),
                opciones: [
                  { value: "todos", label: "Todos" },
                  { value: "Habilitado", label: "Habilitado" },
                  { value: "Deshabilitado", label: "Deshabilitado" },
                ],
              },
              {
                id: "destacado",
                label: "Destacado",
                value: valoresFiltro.destacado || "todos",
                onChange: (valor) => setValorFiltro("destacado", valor),
                opciones: [
                  { value: "todos", label: "Todos" },
                  { value: "si", label: "Sí" },
                  { value: "no", label: "No" },
                ],
              },
            ]}
          />
        ) : null}

        {productos.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-slate-500 sm:px-6">No hay productos registrados.</div>
        ) : productosFiltrados.length === 0 ? (
          <AdminListaVacia onLimpiar={limpiar} />
        ) : (
          <>
            <ProductCatalogTable
              productos={productosPagina}
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
              productos={productosPagina}
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
            {showPagination ? (
              <AdminPaginacion
                page={page}
                totalPages={totalPages}
                total={productosFiltrados.length}
                onChange={setPage}
                label={"Paginaci\u00f3n de productos"}
              />
            ) : null}
          </>
        )}
          </>
        )}
      </section>
    </AdminLayout>
    </AdminPageGate>
    </>
  );
};

export default AdminInventarioProducto;
