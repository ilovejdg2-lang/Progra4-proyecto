import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminFilterToolbar } from "../../../Components/Admin/ui/AdminFilterToolbar";
import { AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { CategoriaNueva, CategoriaOpcionBorrar } from "../../../Components/Admin/ui/CategoriaCampo";
import { ModalCatalogo } from "../../../Components/Admin/ui/CatalogoPaneles";
import { CentralStockEditor } from "./components/CentralStockEditor";
import { ProductCatalogFormDrawer } from "./components/ProductCatalogFormDrawer";
import { ProductDeactivateConfirm } from "./components/ProductDeactivateConfirm";
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
import { asegurarCamposEnEspanol } from "../../../lib/traducir";
import { t } from "../../../lib/t";
import { getActiveSessionUser } from "../../../services/sessionService";
import { obtenerCategorias } from "../../../services/categoriasService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { contactSupportMessage } from "../../../lib/formLimits";
import { ADMIN_STOCK_PRODUCT_EVENT, clearPendingStockProduct, peekPendingStockProduct } from "../../../lib/adminStockAlert";
import { ST } from "../../../Components/T/ST";
import { AdminPageHeader } from "../../../Components/Admin/ui/AdminPageHeader";
import { AdminStatLine } from "../../../Components/Admin/ui/AdminStatLine";
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
  const [modalCategorias, setModalCategorias] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [productoStockEditar, setProductoStockEditar] = useState(null);
  const [productoDesactivar, setProductoDesactivar] = useState(null);
  const [desactivando, setDesactivando] = useState(false);
  const limpiarPendienteTimerRef = useRef(null);
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
      window.clearTimeout(limpiarPendienteTimerRef.current);
      limpiarPendienteTimerRef.current = window.setTimeout(() => {
        limpiarPendienteTimerRef.current = null;
        clearPendingStockProduct();
      }, 500);
    }
  };

  const abrirStockPendienteActual = useEffectEvent(() => abrirStockPendiente());

  useEffect(() => {
    abrirStockPendienteActual();
  }, [puedeActualizarStock, productos]);

  // Flush the delayed pending-request cleanup if the page unmounts before it fires.
  useEffect(
    () => () => {
      if (limpiarPendienteTimerRef.current === null) return;
      window.clearTimeout(limpiarPendienteTimerRef.current);
      limpiarPendienteTimerRef.current = null;
      clearPendingStockProduct();
    },
    [],
  );

  useEffect(() => {
    const onOpenStock = () => {
      abrirStockPendienteActual();
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
      { id: "estado", obtenerValor: (producto) => etiquetaEstadoProducto(producto).texto },
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
      const paraGuardar = await asegurarCamposEnEspanol(form, ["nombre", "descripcion", "categoria", "subcategoria"]);
      await crearProducto(paraGuardar);
      await Promise.all([catalogState.retry(), stockState.retry()]);
      setModalCrear(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async (form) => {
    setGuardando(true);
    try {
      const paraGuardar = await asegurarCamposEnEspanol(form, ["nombre", "descripcion", "categoria", "subcategoria"]);
      await actualizarProducto(productoEditar.id, paraGuardar);
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
      alert(t("No tiene permiso para habilitar o inhabilitar productos."));
      return;
    }

    const nuevoEstado = producto.estado === "Deshabilitado" ? "Habilitado" : "Deshabilitado";

    if (nuevoEstado === "Deshabilitado" && !productoPuedeDeshabilitarse(producto)) {
      alert(t("Quita el producto de destacados antes de deshabilitarlo."));
      return;
    }

    try {
      await actualizarProducto(producto.id, {
        ...producto,
        estado: nuevoEstado,
      });
      await catalogState.retry();
    } catch (err) {
      alert(t(err?.message || "No se pudo cambiar el estado del producto."));
    }
  };

  // Deactivating asks first; activating is non-destructive and runs immediately.
  const solicitarToggleEstado = (producto) => {
    if (puedeInactivar && producto.estado !== "Deshabilitado") {
      setProductoDesactivar(producto);
      return;
    }
    handleToggleEstado(producto);
  };

  const confirmarDesactivar = async () => {
    setDesactivando(true);
    try {
      await handleToggleEstado(productoDesactivar);
    } finally {
      setDesactivando(false);
      setProductoDesactivar(null);
    }
  };

  const handleToggleDestacado = async (producto) => {
    if (!producto.esDestacado) {
      if (contarDestacados(productos) >= MAX_PRODUCTOS_DESTACADOS) {
        alert(t(`Solo puedes destacar hasta ${MAX_PRODUCTOS_DESTACADOS} productos en el inicio.`));
        return;
      }

      if (!productoPuedeDestacarse(producto)) {
        if (productoEstaDeshabilitado(producto)) {
          alert(t("No puedes destacar un producto deshabilitado."));
        } else {
          alert(t("No puedes destacar un producto sin stock."));
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
      alert(t(err?.message || "No se pudo cambiar el estado destacado."));
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

      {productoDesactivar ? (
        <ProductDeactivateConfirm
          producto={productoDesactivar}
          busy={desactivando}
          onCancel={() => setProductoDesactivar(null)}
          onConfirm={confirmarDesactivar}
        />
      ) : null}

      <ModalCatalogo
        open={modalCategorias}
        onClose={() => {
          setModalCategorias(false);
          recargarCategorias();
          catalogState.retry({ silent: true });
        }}
        tipo="categorias"
        titulo="Categorías de productos"
        ayuda="Renombrá categorías y subcategorías y elegí el ícono que aparece en la tienda. Al renombrar, los productos que la usan se actualizan solos."
      />

      <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={<ST>Productos</ST>}
        description={<ST>{"Administración de inventario"}</ST>}
        meta={
          <AdminStatLine
            items={[{ label: <ST>Destacados en inicio</ST>, value: `${destacadosEnUso}/${MAX_PRODUCTOS_DESTACADOS}` }]}
          />
        }
        actions={
          cargando || error ? null : (
            <>
              {puedeEditar ? (
                <button
                  type="button"
                  onClick={() => setModalCategorias(true)}
                  className="w-full rounded-full border px-5 py-2 text-sm font-semibold transition sm:w-auto admin-role-quiet"
                >
                  <ST>Categorías</ST>
                </button>
              ) : null}
              {puedeCrear ? (
                <button
                  type="button"
                  onClick={() => setModalCrear(true)}
                  className="w-full rounded-full border px-5 py-2 text-sm font-semibold transition sm:w-auto admin-role-primary"
                >
                  <ST>+ Nuevo producto</ST>
                </button>
              ) : null}
            </>
          )
        }
      />
      <section className="@container min-w-0 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        {cargando ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 py-14 text-center sm:px-6">
            <span className="admin-route-loading__spinner" aria-hidden="true" />
            <p className="text-sm font-semibold text-[color:var(--admin-text-muted)]"><ST>Cargando productos...</ST></p>
          </div>
        ) : error ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-4 py-14 text-center sm:px-6">
            <p className="max-w-md text-sm font-semibold text-[color:var(--admin-status-danger-text)]"><ST>{error}</ST></p>
            <p className="max-w-md text-xs text-[color:var(--admin-text-muted)]">{contactSupportMessage()}</p>
            <button
              type="button"
              onClick={cargarProductos}
              className="rounded-full border px-4 py-2 text-sm font-semibold transition admin-role-quiet"
            >
              <ST>Reintentar</ST>
            </button>
          </div>
        ) : (
          <>
        {stockState.error ? (
          <div className="flex flex-col gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] px-4 py-3 text-sm text-[color:var(--admin-text-primary)] sm:flex-row sm:items-center sm:justify-between sm:px-6" role="status">
            <span><ST>El catálogo está disponible, pero no se pudo cargar el stock de Bodega Central.</ST></span>
            <button
              type="button"
              onClick={stockState.retry}
              className="min-h-11 rounded-full border px-4 py-2 text-xs font-semibold transition admin-role-quiet"
            >
              <ST>Reintentar stock</ST>
            </button>
          </div>
        ) : null}
        {!cargando && !error ? (
          <AdminFilterToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder="Buscar por nombre, categoría, estado o peso..."
            searchLabel="Buscar producto"
            total={total}
            visibles={visibles}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiar={limpiar}
            filtros={[
              {
                id: "categoria",
                ariaLabel: "Categoría",
                value: valoresFiltro.categoria || "todos",
                onChange: (valor) => setValorFiltro("categoria", valor),
                widthClass: "@4xl:w-48",
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
                options: [
                  { value: "todos", label: "Todas las categorías" },
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
                ariaLabel: "Estado",
                value: valoresFiltro.estado || "todos",
                onChange: (valor) => setValorFiltro("estado", valor),
                widthClass: "@4xl:w-40",
                options: [
                  { value: "todos", label: "Estado" },
                  { value: "Activo", label: "Activo" },
                  { value: "Inactivo", label: "Inactivo" },
                  { value: "Agotado", label: "Agotado" },
                ],
              },
              {
                id: "destacado",
                ariaLabel: "Destacado",
                value: valoresFiltro.destacado || "todos",
                onChange: (valor) => setValorFiltro("destacado", valor),
                widthClass: "@4xl:w-40",
                options: [
                  { value: "todos", label: "Destacado" },
                  { value: "si", label: "Solo destacados" },
                  { value: "no", label: "No destacados" },
                ],
              },
            ]}
          />
        ) : null}

        <div className="border-t border-[var(--admin-border)]">
        {productos.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-[color:var(--admin-text-muted)] sm:px-6"><ST>No hay productos registrados.</ST></div>
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
              puedeEditar={puedeEditar}
              puedeInactivar={puedeInactivar}
              puedeActualizarStock={puedeActualizarStock}
              onToggleDestacado={handleToggleDestacado}
              onEditar={setProductoEditar}
              onEditarStock={setProductoStockEditar}
              onToggleEstado={solicitarToggleEstado}
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
        </div>
          </>
        )}
      </section>
      </div>
    </AdminLayout>
    </AdminPageGate>
    </>
  );
};

export default AdminInventarioProducto;
