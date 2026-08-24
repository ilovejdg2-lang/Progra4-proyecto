import { ProductCatalogFeaturedToggle } from "./ProductCatalogFeaturedToggle";
import { destacadoDeshabilitado, etiquetaEstadoProducto, formatearPrecio } from "./catalogFormatters";

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
        const estadoProducto = etiquetaEstadoProducto(producto);

        return (
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
                  <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoProducto.clase}`}>
                    {estadoProducto.texto}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{producto.descripcion}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span><strong className="text-slate-800">Precio:</strong> {formatearPrecio(producto.precioNormal)}</span>
              <span>
                <strong className="text-slate-800">Stock central:</strong>{" "}
                {producto.centralStock?.confidence === "known"
                  ? producto.centralStock.stock
                  : stockLoading
                    ? "Cargando..."
                    : "No disponible"}
              </span>
              {producto.peso ? <span><strong className="text-slate-800">Peso:</strong> {producto.peso}</span> : null}
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
