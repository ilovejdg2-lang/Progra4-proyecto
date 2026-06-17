import { useEffect, useState } from "react";

import { Pencil, Power, Star, Trash2, X } from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminModal, AdminModalBody, AdminModalHeader } from "../../../Components/Admin/ui/AdminModal";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos,
  calcularPrecioConIVA,
} from "../../../services/productosServices";
import { getActiveSessionUser } from "../../../services/sessionService";
import {
  contactSupportMessage,
  hasFieldErrors,
  MAX_PRODUCTO_DESCRIPCION,
  MAX_PRODUCTO_NOMBRE,
  sanitizeUserFacingError,
  validateProductoForm,
} from "../../../lib/formLimits";

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  imagen: "",
  precioNormal: "",
  precioConIVA: "",
  stock: "",
  estado: "Habilitado",
  peso: "",
  esDestacado: false,
};

const MAX_PRODUCTOS_DESTACADOS = 3;

function contarDestacados(productos, excluirId = null) {
  return productos.filter((item) => item.esDestacado && item.id !== excluirId).length;
}

function Modal({ titulo, onClose, children, ancho = "max-w-2xl" }) {
  return (
    <AdminModal open onClose={onClose} maxWidth={ancho} labelledBy="admin-productos-modal-title">
      <AdminModalHeader>
        <h2 id="admin-productos-modal-title" className="text-lg font-semibold text-slate-950">{titulo}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
      </AdminModalHeader>
      <AdminModalBody>{children}</AdminModalBody>
    </AdminModal>
  );
}

function FormProducto({ inicial, onGuardar, onCancelar, cargando, destacadosOtros = 0 }) {
  const [form, setForm] = useState(() => ({
    ...FORM_VACIO,
    ...inicial,
    precioNormal: inicial?.precioNormal ?? "",
    precioConIVA: calcularPrecioConIVA(inicial?.precioNormal ?? inicial?.precioConIVA ?? 0),
    stock: inicial?.stock ?? "",
    estado: inicial?.estado === "Deshabilitado" ? "Deshabilitado" : "Habilitado",
    esDestacado: Boolean(inicial?.esDestacado),
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "esDestacado" && checked && destacadosOtros >= MAX_PRODUCTOS_DESTACADOS) {
      alert(`Solo puedes destacar hasta ${MAX_PRODUCTOS_DESTACADOS} productos en el inicio.`);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? checked
        : name === "precioNormal" || name === "precioConIVA" || name === "stock"
        ? value === ""
          ? ""
          : Number(value)
        : value,
      precioConIVA: name === "precioNormal"
        ? calcularPrecioConIVA(value === "" ? 0 : Number(value))
        : prev.precioConIVA,
    }));

    if (name === "nombre" || name === "descripcion") {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateProductoForm(form);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setSubmitError("");
      return;
    }

    setFieldErrors({});
    setSubmitError("");

    try {
      await onGuardar({
        ...form,
        precioNormal: Number(form.precioNormal) || 0,
        precioConIVA: calcularPrecioConIVA(form.precioNormal),
        stock: Number(form.stock) || 0,
      });
    } catch (err) {
      const message = sanitizeUserFacingError(err?.message || "No se pudo guardar el producto.");
      if (message.toLowerCase().includes("nombre")) {
        setFieldErrors((prev) => ({ ...prev, nombre: message }));
      } else if (message.toLowerCase().includes("descripción") || message.toLowerCase().includes("descripcion")) {
        setFieldErrors((prev) => ({ ...prev, descripcion: message }));
      } else {
        setSubmitError(message);
      }
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
  const inputErrorCls = "border-red-500 focus:border-red-500 focus:ring-red-100";
  const fieldErrorCls = "text-xs text-red-600";
  const textareaCls = `${inputCls} min-h-[6rem] resize-y break-words whitespace-pre-wrap overflow-x-hidden`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Nombre
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            maxLength={MAX_PRODUCTO_NOMBRE}
            className={`${inputCls} ${fieldErrors.nombre ? inputErrorCls : ""}`}
            required
          />
          {fieldErrors.nombre ? <span className={fieldErrorCls}>{fieldErrors.nombre}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Descripción
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={4}
            maxLength={MAX_PRODUCTO_DESCRIPCION}
            className={`${textareaCls} ${fieldErrors.descripcion ? inputErrorCls : ""}`}
            required
          />
          {fieldErrors.descripcion ? <span className={fieldErrorCls}>{fieldErrors.descripcion}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Imagen URL
          <input name="imagen" value={form.imagen} onChange={handleChange} className={inputCls} />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Precio normal
          <input type="number" name="precioNormal" value={form.precioNormal} onChange={handleChange} className={inputCls} min="0" required />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Precio con IVA
          <input type="number" name="precioConIVA" value={form.precioConIVA} className={inputCls} min="0" readOnly aria-readonly="true" />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Stock
          <input type="number" name="stock" value={form.stock} onChange={handleChange} className={inputCls} min="0" required />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Peso
          <input name="peso" value={form.peso} onChange={handleChange} className={inputCls} placeholder="500g / 1kg" />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Estado
          <select name="estado" value={form.estado} onChange={handleChange} className={inputCls}>
            <option value="Habilitado">Habilitado</option>
            <option value="Deshabilitado">Deshabilitado</option>
          </select>
        </label>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 md:col-span-2">
          <input
            type="checkbox"
            name="esDestacado"
            checked={Boolean(form.esDestacado)}
            onChange={handleChange}
            disabled={!form.esDestacado && destacadosOtros >= MAX_PRODUCTOS_DESTACADOS}
            className="size-4 rounded border-slate-300 text-amber-700 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          Mostrar como destacado en el inicio
        </label>
        <p className="text-xs text-slate-500 md:col-span-2">
          Maximo {MAX_PRODUCTOS_DESTACADOS} productos destacados en el inicio
          ({Math.min(destacadosOtros + (form.esDestacado ? 1 : 0), MAX_PRODUCTOS_DESTACADOS)}/{MAX_PRODUCTOS_DESTACADOS}).
        </p>
      </div>

      {submitError ? <p className={fieldErrorCls}>{submitError}</p> : null}

      <div className="flex flex-col-reverse justify-end gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancelar}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {cargando ? "Guardando..." : inicial ? "Guardar cambios" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

const accionBtnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

function AccionesProducto({ producto, esSuperAdmin, onEditar, onToggleEstado, onEliminar, variant = "table" }) {
  const esDeshabilitado = producto.estado === "Deshabilitado";
  const esMovil = variant === "mobile";

  const editarCls = `${accionBtnBase} border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 focus-visible:ring-amber-300`;
  const toggleCls = `${accionBtnBase} ${
    esDeshabilitado
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
  }`;
  const eliminarCls = `${accionBtnBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300`;

  if (esMovil) {
    return (
      <div className={`grid gap-2 ${esSuperAdmin ? "grid-cols-3" : "grid-cols-1"}`}>
        <button type="button" onClick={onEditar} className={`${editarCls} min-h-10 px-2 py-2`}>
          <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Editar</span>
        </button>
        {esSuperAdmin ? (
          <>
            <button type="button" onClick={onToggleEstado} className={`${toggleCls} min-h-10 px-2 py-2`}>
              <Power className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{esDeshabilitado ? "Habilitar" : "Inhabilitar"}</span>
            </button>
            <button type="button" onClick={onEliminar} className={`${eliminarCls} min-h-10 px-2 py-2`}>
              <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Eliminar</span>
            </button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`grid w-[11.5rem] gap-1.5 ${esSuperAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
      <button type="button" onClick={onEditar} className={`${editarCls} h-9 px-2.5`}>
        <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
        <span>Editar</span>
      </button>
      {esSuperAdmin ? (
        <>
          <button type="button" onClick={onToggleEstado} className={`${toggleCls} h-9 px-2.5`}>
            <Power className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{esDeshabilitado ? "Habilitar" : "Inhabilitar"}</span>
          </button>
          <button type="button" onClick={onEliminar} className={`${eliminarCls} col-span-2 h-9 px-2.5`}>
            <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span>Eliminar</span>
          </button>
        </>
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
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles.map((rol) => String(rol).toLowerCase()) : [];
  const esSuperAdmin = actorRoles.includes("superadmin");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/producto', !cargando);

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
    } catch (err) {
      throw err;
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
    } catch (err) {
      throw err;
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (producto) => {
    if (!esSuperAdmin) {
      alert("Solo SuperAdmin puede eliminar productos.");
      return;
    }

    const confirmar = window.confirm(`¿Eliminar ${producto.nombre}?`);
    if (!confirmar) return;

    try {
      await eliminarProducto(producto.id);
      setProductos((prev) => prev.filter((item) => item.id !== producto.id));
    } catch {
      alert("No se pudo eliminar el producto.");
    }
  };

  const handleToggleEstado = async (producto) => {
    if (!esSuperAdmin) {
      alert("Solo SuperAdmin puede habilitar o inhabilitar productos.");
      return;
    }

    const nuevoEstado = producto.estado === "Deshabilitado" ? "Habilitado" : "Deshabilitado";
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
    if (!producto.esDestacado && contarDestacados(productos) >= MAX_PRODUCTOS_DESTACADOS) {
      alert(`Solo puedes destacar hasta ${MAX_PRODUCTOS_DESTACADOS} productos en el inicio.`);
      return;
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
      {modalCrear && (
        <Modal titulo="Nuevo producto" onClose={() => setModalCrear(false)}>
          <FormProducto
            destacadosOtros={destacadosEnUso}
            onGuardar={handleCrear}
            onCancelar={() => setModalCrear(false)}
            cargando={guardando}
          />
        </Modal>
      )}

      {productoEditar && (
        <Modal titulo="Editar producto" onClose={() => setProductoEditar(null)}>
          <FormProducto
            inicial={productoEditar}
            destacadosOtros={contarDestacados(productos, productoEditar.id)}
            onGuardar={handleEditar}
            onCancelar={() => setProductoEditar(null)}
            cargando={guardando}
          />
        </Modal>
      )}

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
            <p className="mt-1 text-sm text-slate-500">Administración de inventario</p>
            <p className="mt-1 text-xs text-slate-400">
              Destacados en inicio: {destacadosEnUso}/{MAX_PRODUCTOS_DESTACADOS}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalCrear(true)}
            className="w-full rounded-full bg-amber-900 px-5 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-800 sm:w-auto"
          >
            + Nuevo producto
          </button>
        </div>

        {productos.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-slate-500 sm:px-6">No hay productos registrados.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Imagen</th>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Destacado</th>
                    <th className="px-6 py-4 w-48">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-6 py-4">
                        {producto.imagen ? (
                          <img
                            src={producto.imagen}
                            alt={producto.nombre}
                            className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 text-xs text-slate-500">
                            Sin foto
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{producto.nombre}</div>
                        <div className="mt-1 line-clamp-2 max-w-xl text-xs leading-5 text-slate-500">
                          {producto.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{formatearPrecio(producto.precioNormal)}</td>
                      <td className="px-6 py-4 text-slate-700">{producto.stock}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            producto.estado === "Deshabilitado"
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {producto.estado === "Deshabilitado" ? "Deshabilitado" : "Habilitado"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleDestacado(producto)}
                          disabled={!producto.esDestacado && destacadosEnUso >= MAX_PRODUCTOS_DESTACADOS}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            producto.esDestacado
                              ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          aria-pressed={producto.esDestacado}
                        >
                          <Star className={`size-3.5 ${producto.esDestacado ? "fill-current" : ""}`} aria-hidden="true" />
                          {producto.esDestacado ? "Si" : "No"}
                        </button>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <AccionesProducto
                          producto={producto}
                          esSuperAdmin={esSuperAdmin}
                          onEditar={() => setProductoEditar(producto)}
                          onToggleEstado={() => handleToggleEstado(producto)}
                          onEliminar={() => handleEliminar(producto)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {productos.map((producto) => (
                <article key={producto.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start gap-3">
                    {producto.imagen ? (
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs text-slate-500">
                        Sin foto
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900">{producto.nombre}</h3>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            producto.estado === "Deshabilitado"
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {producto.estado === "Deshabilitado" ? "Deshabilitado" : "Habilitado"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{producto.descripcion}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span><strong className="text-slate-800">Precio:</strong> {formatearPrecio(producto.precioNormal)}</span>
                    <span><strong className="text-slate-800">Stock:</strong> {producto.stock}</span>
                    {producto.peso ? <span><strong className="text-slate-800">Peso:</strong> {producto.peso}</span> : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleDestacado(producto)}
                    disabled={!producto.esDestacado && destacadosEnUso >= MAX_PRODUCTOS_DESTACADOS}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      producto.esDestacado
                        ? "bg-amber-50 text-amber-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Star className={`size-3.5 ${producto.esDestacado ? "fill-current" : ""}`} aria-hidden="true" />
                    {producto.esDestacado ? "Destacado en inicio" : "Marcar como destacado"}
                  </button>

                  <AccionesProducto
                    producto={producto}
                    esSuperAdmin={esSuperAdmin}
                    variant="mobile"
                    onEditar={() => setProductoEditar(producto)}
                    onToggleEstado={() => handleToggleEstado(producto)}
                    onEliminar={() => handleEliminar(producto)}
                  />
                </article>
              ))}
            </div>
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
