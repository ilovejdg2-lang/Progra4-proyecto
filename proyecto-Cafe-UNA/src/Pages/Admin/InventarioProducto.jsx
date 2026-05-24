import { useEffect, useState } from "react";

import { AdminLayout } from "../../layouts/AdminLayout";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos,
} from "../../services/productosServices";

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  imagen: "",
  precioNormal: "",
  precioConIVA: "",
  stock: "",
  estado: "Disponible",
  peso: "",
};

function Modal({ titulo, onClose, children, ancho = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className={`w-full ${ancho} overflow-hidden rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function FormProducto({ inicial, onGuardar, onCancelar, cargando }) {
  const [form, setForm] = useState(() => ({
    ...FORM_VACIO,
    ...inicial,
    precioNormal: inicial?.precioNormal ?? "",
    precioConIVA: inicial?.precioConIVA ?? "",
    stock: inicial?.stock ?? "",
  }));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "precioNormal" || name === "precioConIVA" || name === "stock"
        ? value === ""
          ? ""
          : Number(value)
        : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onGuardar({
      ...form,
      precioNormal: Number(form.precioNormal) || 0,
      precioConIVA: Number(form.precioConIVA) || 0,
      stock: Number(form.stock) || 0,
    });
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Nombre
          <input name="nombre" value={form.nombre} onChange={handleChange} className={inputCls} required />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
          Descripción
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={4}
            className={inputCls}
            required
          />
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
          <input type="number" name="precioConIVA" value={form.precioConIVA} onChange={handleChange} className={inputCls} min="0" required />
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
            <option value="Disponible">Disponible</option>
            <option value="Agotado">Agotado</option>
            <option value="Descontinuado">Descontinuado</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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

const AdminInventarioProducto = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await obtenerProductos();
      setProductos(data);
    } catch {
      setError("No se pudieron cargar los productos.");
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
    try {
      setGuardando(true);
      const nuevo = await crearProducto(form);
      setProductos((prev) => [...prev, nuevo]);
      setModalCrear(false);
    } catch {
      alert("No se pudo crear el producto.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async (form) => {
    try {
      setGuardando(true);
      const actualizado = await actualizarProducto(productoEditar.id, form);
      setProductos((prev) => prev.map((producto) => (producto.id === actualizado.id ? actualizado : producto)));
      setProductoEditar(null);
    } catch {
      alert("No se pudo actualizar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (producto) => {
    const confirmar = window.confirm(`¿Eliminar ${producto.nombre}?`);
    if (!confirmar) return;

    try {
      await eliminarProducto(producto.id);
      setProductos((prev) => prev.filter((item) => item.id !== producto.id));
    } catch {
      alert("No se pudo eliminar el producto.");
    }
  };

  return (
    <AdminLayout>
      {modalCrear && (
        <Modal titulo="Nuevo producto" onClose={() => setModalCrear(false)}>
          <FormProducto
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
            onGuardar={handleEditar}
            onCancelar={() => setProductoEditar(null)}
            cargando={guardando}
          />
        </Modal>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Productos</h1>
            <p className="mt-1 text-sm text-slate-500">Administración de inventario</p>
          </div>

          <button
            type="button"
            onClick={() => setModalCrear(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Nuevo producto
          </button>
        </div>

        {cargando ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">Cargando productos...</div>
        ) : error ? (
          <div className="px-6 py-14 text-center text-sm text-red-500">
            <p>{error}</p>
            <button type="button" onClick={cargarProductos} className="mt-3 font-semibold text-slate-700 underline">
              Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">No hay productos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Imagen</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acciones</th>
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
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {producto.estado || "Disponible"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setProductoEditar(producto)}
                          className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-200"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(producto)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminInventarioProducto;
