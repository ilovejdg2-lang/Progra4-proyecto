import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import { ProductThumb } from "../../../../Components/Admin/ui/ProductThumb";
import { StatusDot } from "../../../../Components/Admin/ui/StatusDot";
import { StockCell } from "../../../../Components/Admin/ui/StockCell";
import { ST } from "../../../../Components/T/ST";
import { etiquetaCategoriaProducto } from "../../../../lib/categorias";
import { motivoDestacadoBloqueado, estadoFilaProducto, formatearPrecio } from "./catalogFormatters";
import { ProductFeaturedStar } from "./ProductFeaturedStar";
import { ProductRowActions } from "./ProductRowActions";

const muted = "text-[color:var(--admin-text-muted)]";
const primary = "text-[color:var(--admin-text-primary)]";
const rowInteractive = "cursor-pointer transition-colors hover:bg-[var(--admin-surface-hover)]";

function SortHeader({ label, active, direction, onClick }) {
  const Icon = active ? (direction === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button
      type="button"
      className="admin-th-sort rounded-full! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--admin-focus-ring)]"
      onClick={onClick}
    >
      <span><ST>{label}</ST></span>
      <Icon className={`size-3.5 shrink-0 ${active ? "" : "opacity-60"}`} aria-hidden="true" />
    </button>
  );
}

function RowStatus({ producto }) {
  const estado = estadoFilaProducto(producto);
  return (
    <span className={`inline-flex items-center gap-2 ${muted}`}>
      <StatusDot tone={estado.tono} />
      <ST>{estado.texto}</ST>
    </span>
  );
}

function categoriaDe(producto) {
  return etiquetaCategoriaProducto(producto) || "";
}

function StockValue({ producto, stockLoading }) {
  const conocido = producto.centralStock?.confidence === "known";
  return <StockCell stock={conocido ? producto.centralStock.stock : null} loading={stockLoading && !conocido} />;
}

export function ProductCatalogTable({
  productos,
  destacadosEnUso,
  maxDestacados,
  puedeDestacarse,
  stockLoading = false,
  puedeEditar = false,
  puedeInactivar = false,
  puedeActualizarStock = false,
  onToggleDestacado,
  onEditar,
  onEditarStock,
  onToggleEstado,
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
      const va = String(a.nombre ?? "").toLocaleLowerCase("es");
      const vb = String(b.nombre ?? "").toLocaleLowerCase("es");
      return va.localeCompare(vb, "es") * factor;
    });
    return lista;
  }, [productos, sort]);

  const toggleSort = (key) => {
    setSort((actual) =>
      actual.key === key ? { key, dir: actual.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  };
  const sortProps = (key, label) => ({
    label,
    active: sort.key === key,
    direction: sort.dir,
    onClick: () => toggleSort(key),
  });

  const abrirFila = puedeEditar ? onEditar : undefined;
  const star = (producto) => {
    const motivo = motivoDestacadoBloqueado(producto, destacadosEnUso, maxDestacados, puedeDestacarse);
    return (
      <ProductFeaturedStar
        producto={producto}
        disabled={Boolean(motivo)}
        motivo={motivo}
        onToggle={onToggleDestacado}
      />
    );
  };
  const actions = (producto, compact) => (
    <ProductRowActions
      producto={producto}
      compact={compact}
      puedeEditar={puedeEditar}
      puedeInactivar={puedeInactivar}
      puedeActualizarStock={puedeActualizarStock}
      onEditar={onEditar}
      onEditarStock={onEditarStock}
      onToggleEstado={onToggleEstado}
    />
  );

  return (
    <>
      <div className="admin-table-shell admin-table-shell--aligned hidden min-w-0 @xl:block">
        <table className="w-full text-left text-[length:var(--text-body)]">
          <thead>
            <tr className="border-b border-[var(--admin-border)]">
              <th scope="col" className="px-6 py-3 font-semibold"><SortHeader {...sortProps("nombre", "Producto")} /></th>
              <th scope="col" className="px-4 py-3 text-right font-semibold"><SortHeader {...sortProps("precio", "Precio")} /></th>
              <th scope="col" className="px-4 py-3 text-right font-semibold"><SortHeader {...sortProps("stock", "Stock")} /></th>
              <th scope="col" className="px-4 py-3 font-semibold"><ST>Estado</ST></th>
              <th scope="col" className="px-2 py-3 text-center font-semibold"><ST>Destacado</ST></th>
              <th scope="col" className="px-4 py-3 pr-6"><span className="sr-only"><ST>Acciones</ST></span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)]">
            {ordenados.map((producto) => {
              const categoria = categoriaDe(producto);
              return (
                <tr
                  key={producto.id}
                  onClick={abrirFila ? () => abrirFila(producto) : undefined}
                  className={puedeEditar ? rowInteractive : ""}
                >
                  <td className="px-6 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductThumb product={producto} />
                      <div className="min-w-0">
                        <p className={`break-words font-semibold leading-snug ${primary}`}><ST>{producto.nombre}</ST></p>
                        {categoria ? (
                          <p className={`mt-0.5 break-words leading-snug ${muted}`}><ST>{categoria}</ST></p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right tabular-nums ${primary}`}>
                    {formatearPrecio(producto.precioNormal)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <StockValue producto={producto} stockLoading={stockLoading} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2"><RowStatus producto={producto} /></td>
                  <td className="px-2 py-2" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-center">{star(producto)}</div>
                  </td>
                  <td className="px-4 py-2 pr-6">{actions(producto, false)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-[var(--admin-border)] @xl:hidden">
        {ordenados.map((producto) => {
          const categoria = categoriaDe(producto);
          return (
            <li
              key={producto.id}
              onClick={abrirFila ? () => abrirFila(producto) : undefined}
              className={`flex min-w-0 items-center gap-2 py-2 pl-3 pr-1 ${puedeEditar ? rowInteractive : ""}`}
            >
              <ProductThumb product={producto} />
              <div className="min-w-0 flex-1">
                <p className={`break-words font-semibold leading-snug ${primary}`}><ST>{producto.nombre}</ST></p>
                <p className={`mt-0.5 flex flex-wrap items-center gap-x-3 text-xs ${muted}`}>
                  {categoria ? <span><ST>{categoria}</ST></span> : null}
                  <RowStatus producto={producto} />
                </p>
              </div>
              <div className="shrink-0 text-right text-[length:var(--text-body)] leading-snug">
                <p className={`tabular-nums ${primary}`}>{formatearPrecio(producto.precioNormal)}</p>
                <p className="mt-0.5">
                  <StockValue producto={producto} stockLoading={stockLoading} />
                </p>
              </div>
              <div className="flex shrink-0 items-center" onClick={(event) => event.stopPropagation()}>
                {star(producto)}
                {actions(producto, true)}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
