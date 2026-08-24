import { useEffect, useState } from "react";

import { Pencil, Power, Trash2 } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { ProductCatalogFormDrawer } from "./components/ProductCatalogFormDrawer";
import { ProductCatalogMobileList } from "./components/ProductCatalogMobileList";
import { ProductCatalogTable } from "./components/ProductCatalogTable";
import { etiquetaEstadoProducto } from "./components/catalogFormatters";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
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

const accionBtnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

function AccionesProducto({ producto, puedeEditar, puedeInactivar, puedeEliminar, onEditar, onToggleEstado, onEliminar, variant = "table" }) {
  const esDeshabilitado = producto.estado === "Deshabilitado";
  const esMovil = variant === "mobile";
  const bloquearInhabilitar = producto.esDestacado && !esDeshabilitado;
  const mostrarExtras = puedeInactivar || puedeEliminar;

  const editarCls = `${accionBtnBase} border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-300`;
  const toggleCls = `${accionBtnBase} ${
    esDeshabilitado
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
  }`;
  const eliminarCls = `${accionBtnBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300`;

  return (
    <div className={`grid gap-1.5 ${esMovil ? "gap-2" : "w-[11.5rem]"} ${mostrarExtras ? (esMovil ? "grid-cols-3" : "grid-cols-2") : "grid-cols-1"}`}>
      {puedeEditar ? (
        <button type="button" onClick={onEditar} className={`${editarCls} ${esMovil ? "min-h-10 px-2 py-2" : "h-9 px-2.5"}`}>
          <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
          <span className={esMovil ? "truncate" : ""}>Editar</span>
        </button>
      ) : null}
      {puedeInactivar ? (
        <button
          type="button"
          onClick={onToggleEstado}
          disabled={bloquearInhabilitar}
          title={bloquearInhabilitar ? "Quita el destacado antes de deshabilitarlo" : undefined}
          className={`${toggleCls} ${esMovil ? "min-h-10 px-2 py-2" : "h-9 px-2.5"} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Power className="size-3.5 shrink-0" aria-hidden="true" />
          <span className={esMovil ? "truncate" : ""}>{esDeshabilitado ? "Habilitar" : "Inhabilitar"}</span>
        </button>
      ) : null}
      {puedeEliminar ? (
        <button type="button" onClick={onEliminar} className={`${eliminarCls} ${esMovil ? "min-h-10 px-2 py-2" : "col-span-2 h-9 px-2.5"}`}>
          <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
          <span className={esMovil ? "truncate" : ""}>Eliminar</span>
        </button>
      ) : null}
    </div>
  );
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
  const puedeEliminar = tienePermiso(actorRoles, "crear_productos");
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

  const handleEliminar = async (producto) => {
    if (!puedeEliminar) {
      alert("No tiene permiso para eliminar productos.");
      return;
    }

    const confirmar = window.confirm(`\u00bfEliminar ${producto.nombre}?`);
    if (!confirmar) return;

    try {
      await eliminarProducto(producto.id);
      setProductos((prev) => prev.filter((item) => item.id !== producto.id));
    } catch {
      alert("No se pudo eliminar el producto.");
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
                <AccionesProducto
                  producto={producto}
                  puedeEditar={puedeEditar}
                  puedeInactivar={puedeInactivar}
                  puedeEliminar={puedeEliminar}
                  onEditar={() => setProductoEditar(producto)}
                  onToggleEstado={() => handleToggleEstado(producto)}
                  onEliminar={() => handleEliminar(producto)}
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
                <AccionesProducto
                  producto={producto}
                  puedeEditar={puedeEditar}
                  puedeInactivar={puedeInactivar}
                  puedeEliminar={puedeEliminar}
                  variant="mobile"
                  onEditar={() => setProductoEditar(producto)}
                  onToggleEstado={() => handleToggleEstado(producto)}
                  onEliminar={() => handleEliminar(producto)}
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
