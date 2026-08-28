import { useMemo, useState } from "react";
import { ProductCatalogFeaturedToggle } from "./ProductCatalogFeaturedToggle";
import { destacadoDeshabilitado, etiquetaEstadoProducto, formatearPrecio } from "./catalogFormatters";
import { etiquetaCategoriaProducto } from "../../../../lib/categorias";
import { imagenPrincipalProducto } from "../../../../lib/productoImagenes";

function SortHeader({ label, active, direction, onClick }) {
  return (
    <button type="button" className="admin-th-sort" onClick={onClick}>
      <span>{label}</span>
      <span className="admin-th-sort__icon" aria-hidden="true">
        {active ? (direction === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

export function ProductCatalogTable({
  productos,
  destacadosEnUso,
  maxDestacados,
  puedeDestacarse,
  stockLoading = false,
  onToggleDestacado,
  renderAcciones,
}) {
  const [sort, setSort] = useState({ key: "nombre", dir: "asc" });

  const ordenados = useMemo(() => {
    const lista = [...productos];
    const factor = sort.dir === "asc" ? 1 : -1;
    lista.sort((a, b) => {
      if (sort.key === "precio") {
        return (Number(a.precioNormal) - Number(b.precioNormal)) * factor;
      }
      if (sort.key === "stock") {
        const sa = a.centralStock?.confidence === "known" ? Number(a.centralStock.stock) : -1;
        const sb = b.centralStock?.confidence === "known" ? Number(b.centralStock.stock) : -1;
        return (sa - sb) * factor;
      }
      const va = String(a[sort.key] ?? a.nombre ?? "").toLocaleLowerCase("es");
      const vb = String(b[sort.key] ?? b.nombre ?? "").toLocaleLowerCase("es");
      return va.localeCompare(vb, "es") * factor;
    });
    return lista;
  }, [productos, sort]);

  const toggleSort = (key) => {
    setSort((actual) =>
      actual.key === key
        ? { key, dir: actual.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  return (
    <div className="admin-table-shell hidden min-w-0 md:block">
      <table className="w-full text-left text-[length:var(--text-body)]">
        <thead>
          <tr>
            <th scope="col">Imagen</th>
            <th scope="col">
              <SortHeader
                label="Nombre"
                active={sort.key === "nombre"}
                direction={sort.dir}
                onClick={() => toggleSort("nombre")}
              />
            </th>
            <th scope="col">
              <SortHeader
                label="Categoría"
                active={sort.key === "categoria"}
                direction={sort.dir}
                onClick={() => toggleSort("categoria")}
              />
            </th>
            <th scope="col">
              <SortHeader
                label="Precio"
                active={sort.key === "precio"}
                direction={sort.dir}
                onClick={() => toggleSort("precio")}
              />
            </th>
            <th scope="col">
              <SortHeader
                label="Stock"
                active={sort.key === "stock"}
                direction={sort.dir}
                onClick={() => toggleSort("stock")}
              />
            </th>
            <th scope="col">Estado</th>
            <th scope="col">Destacado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((producto) => {
            const foto = imagenPrincipalProducto(producto);
            const estadoProducto = etiquetaEstadoProducto(producto);

            return (
              <tr key={producto.id} className="border-b border-slate-100 last:border-b-0">
                <td className="py-3 align-middle">
                  {foto ? (
                    <img
                      src={foto}
                      alt={producto.nombre}
                      className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-[length:var(--text-body)] text-slate-500">
                      Sin foto
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="font-medium text-[#2a1612]">{producto.nombre}</div>
                  <div className="mt-1 line-clamp-2 max-w-xs text-[length:var(--text-body)] leading-5 text-slate-500">
                    {producto.descripcion}
                  </div>
                </td>
                <td className="px-4 py-3 align-middle text-slate-600">{etiquetaCategoriaProducto(producto) || "—"}</td>
                <td className="px-4 py-3 align-middle whitespace-nowrap text-slate-700">{formatearPrecio(producto.precioNormal)}</td>
                <td className="px-4 py-3 align-middle text-slate-700">
                  {producto.centralStock?.confidence === "known"
                    ? producto.centralStock.stock
                    : stockLoading
                      ? "Cargando..."
                      : "No disponible"}
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className={`text-[length:var(--text-body)] font-semibold ${estadoProducto.clase}`}>
                    {estadoProducto.texto}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <ProductCatalogFeaturedToggle
                    producto={producto}
                    disabled={destacadoDeshabilitado(producto, destacadosEnUso, maxDestacados, puedeDestacarse)}
                    onToggle={() => onToggleDestacado(producto)}
                  />
                </td>
                <td className="py-3 align-middle">{renderAcciones(producto)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
