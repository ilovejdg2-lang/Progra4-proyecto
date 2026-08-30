import { useMemo, useState } from "react";
import { ProductCatalogFeaturedToggle } from "./ProductCatalogFeaturedToggle";
import { destacadoDeshabilitado, etiquetaEstadoProducto, formatearPrecio } from "./catalogFormatters";
import { etiquetaCategoriaProducto } from "../../../../lib/categorias";
import { imagenPrincipalProducto } from "../../../../lib/productoImagenes";
import { ST } from "../../../../Components/T/ST";

function SortHeader({ label, active, direction, onClick }) {
  return (
    <button type="button" className="admin-th-sort" onClick={onClick}>
      <span><ST>{label}</ST></span>
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
    <div className="admin-table-shell admin-table-shell--productos hidden min-w-0 md:block">
      <table className="w-full text-[length:var(--text-body)]">
        <colgroup>
          <col style={{ width: "4.5rem" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "7.5rem" }} />
          <col style={{ width: "5.5rem" }} />
          <col style={{ width: "6.5rem" }} />
          <col style={{ width: "7rem" }} />
          <col style={{ width: "12rem" }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col"><ST>Img</ST></th>
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
            <th scope="col"><ST>Estado</ST></th>
            <th scope="col"><ST>Destacado</ST></th>
            <th scope="col"><ST>Acciones</ST></th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((producto) => {
            const foto = imagenPrincipalProducto(producto);
            const estadoProducto = etiquetaEstadoProducto(producto);
            const categoria = etiquetaCategoriaProducto(producto) || "—";
            const stockTexto =
              producto.centralStock?.confidence === "known"
                ? String(producto.centralStock.stock)
                : stockLoading
                  ? "…"
                  : "—";

            return (
              <tr key={producto.id} className="border-b border-slate-100 last:border-b-0">
                <td className="py-2.5">
                  {foto ? (
                    <img
                      src={foto}
                      alt=""
                      className="mx-auto h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-[length:var(--text-body)] text-slate-500">
                      —
                    </div>
                  )}
                </td>
                <td className="px-2 py-2.5">
                  <div className="truncate font-medium text-[#2a1612]" title={producto.nombre}>
                    <ST>{producto.nombre}</ST>
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <span className="block truncate text-slate-600" title={categoria}>
                    <ST>{categoria}</ST>
                  </span>
                </td>
                <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                  {formatearPrecio(producto.precioNormal)}
                </td>
                <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">{stockTexto}</td>
                <td className="px-2 py-2.5">
                  <span className={`font-semibold ${estadoProducto.clase}`}>
                    <ST>{estadoProducto.texto}</ST>
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex justify-center">
                    <ProductCatalogFeaturedToggle
                      producto={producto}
                      disabled={destacadoDeshabilitado(
                        producto,
                        destacadosEnUso,
                        maxDestacados,
                        puedeDestacarse,
                      )}
                      onToggle={() => onToggleDestacado(producto)}
                      compact
                    />
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex justify-center">{renderAcciones(producto)}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
