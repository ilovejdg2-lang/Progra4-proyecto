import { useEffect, useState } from "react";



import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { ProductActions } from "./components/ProductActions";
import { ProductCatalogFormDrawer } from "./components/ProductCatalogFormDrawer";
import { ProductCatalogMobileList } from "./components/ProductCatalogMobileList";
import { ProductCatalogTable } from "./components/ProductCatalogTable";
import { etiquetaEstadoProducto } from "./components/catalogFormatters";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import {
  actualizarProducto,
  crearProducto,
  obtenerProductos,
} from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { contactSupportMessage, sanitizeUserFacingError } from "../../../lib/formLimits";
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
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
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

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerProductos();
      setProductos(data);
    } catch (err) {
      setError(sanitizeUserFacingError(err?.message || "No se pudieron cargar los productos."));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const inicializar = async () => {
      try {
        setCargando(true);
        setError(null);
        const data = await obtenerProductos();

        if (activo) {
          setProductos(data);
        }
      } catch {
        if (activo) {
          setError("No se pudieron cargar los productos.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    inicializar();

    return () => {
      activo = false;
    };
  }, []);

  const handleCrear = async (form) => {
    setGuardando(true);
    try {
      const nuevo = await crearProducto(form);
      setProductos((prev) => [...prev, nuevo]);
      setModalCrear(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async (form) => {
    setGuardando(true);
    try {
      const actualizado = await actualizarProducto(productoEditar.id, form);
      setProductos((prev) => prev.map((producto) => (producto.id === actualizado.id ? actualizado : producto)));
      setProductoEditar(null);
    } finally {
      setGuardando(false);
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
      const actualizado = await actualizarProducto(producto.id, {
        ...producto,
        estado: nuevoEstado,
      });
      setProductos((prev) => prev.map((item) => (item.id === actualizado.id ? actualizado : item)));
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
      const actualizado = await actualizarProducto(producto.id, {
        esDestacado: !producto.esDestacado,
      });
      setProductos((prev) => prev.map((item) => (item.id === actualizado.id ? actualizado : item)));
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
              onToggleDestacado={handleToggleDestacado}
              renderAcciones={(producto) => (
                <ProductActions
                  producto={producto}
                  puedeEditar={puedeEditar}
                  puedeInactivar={puedeInactivar}
                  onEditar={() => setProductoEditar(producto)}
                  onToggleEstado={() => handleToggleEstado(producto)}
                />
              )}
            />
            <ProductCatalogMobileList
              productos={productosFiltrados}
              destacadosEnUso={destacadosEnUso}
              maxDestacados={MAX_PRODUCTOS_DESTACADOS}
              puedeDestacarse={productoPuedeDestacarse}
              onToggleDestacado={handleToggleDestacado}
              renderAcciones={(producto) => (
                <ProductActions
                  producto={producto}
                  puedeEditar={puedeEditar}
                  puedeInactivar={puedeInactivar}
                  variant="mobile"
                  onEditar={() => setProductoEditar(producto)}
                  onToggleEstado={() => handleToggleEstado(producto)}
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
