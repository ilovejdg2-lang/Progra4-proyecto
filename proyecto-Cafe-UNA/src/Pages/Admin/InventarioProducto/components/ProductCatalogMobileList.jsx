import { ProductCatalogFeaturedToggle } from "./ProductCatalogFeaturedToggle";
import { destacadoDeshabilitado, etiquetaEstadoProducto, formatearPrecio } from "./catalogFormatters";
import { etiquetaCategoriaProducto } from "../../../../lib/categorias";
import { imagenPrincipalProducto } from "../../../../lib/productoImagenes";
import { ST } from "../../../../Components/T/ST";

export function ProductCatalogMobileList({
  productos,
  destacadosEnUso,
  maxDestacados,
  puedeDestacarse,
  stockLoading = false,
  onToggleDestacado,
  renderAcciones,
}) {
  return (
    <div className="divide-y divide-slate-100 md:hidden">
      {productos.map((producto) => {
        const foto = imagenPrincipalProducto(producto);
        const estadoProducto = etiquetaEstadoProducto(producto);

        return (
          <article key={producto.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start gap-3">
              {foto ? (
                <img
                  src={foto}
                  alt={producto.nombre}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs text-slate-500">
                  <ST>Sin foto</ST>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900"><ST>{producto.nombre}</ST></h3>
                  <span className={`shrink-0 text-xs font-semibold ${estadoProducto.clase}`}>
                    <ST>{estadoProducto.texto}</ST>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span><strong className="text-slate-800"><ST>Precio</ST>:</strong> {formatearPrecio(producto.precioNormal)}</span>
              <span>
                <strong className="text-slate-800"><ST>Stock central</ST>:</strong>{" "}
                {producto.centralStock?.confidence === "known"
                  ? producto.centralStock.stock
                  : stockLoading
                    ? <ST>Cargando...</ST>
                    : <ST>No disponible</ST>}
              </span>
              {producto.peso ? <span><strong className="text-slate-800"><ST>Peso</ST>:</strong> {producto.peso}</span> : null}
              {etiquetaCategoriaProducto(producto) ? (
                <span><strong className="text-slate-800"><ST>Categoría</ST>:</strong> <ST>{etiquetaCategoriaProducto(producto)}</ST></span>
              ) : null}
            </div>

            <ProductCatalogFeaturedToggle
              producto={producto}
              variant="mobile"
              disabled={destacadoDeshabilitado(producto, destacadosEnUso, maxDestacados, puedeDestacarse)}
              onToggle={() => onToggleDestacado(producto)}
            />

            {renderAcciones(producto, "mobile")}
          </article>
        );
      })}
    </div>
  );
}
