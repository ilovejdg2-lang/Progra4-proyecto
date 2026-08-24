import { ProductCatalogFeaturedToggle } from "./ProductCatalogFeaturedToggle";
import { destacadoDeshabilitado, etiquetaEstadoProducto, formatearPrecio } from "./catalogFormatters";

export function ProductCatalogTable({
  productos,
  destacadosEnUso,
  maxDestacados,
  puedeDestacarse,
  onToggleDestacado,
  renderAcciones,
}) {
  return (
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
            <th className="w-48 px-6 py-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            const estadoProducto = etiquetaEstadoProducto(producto);

            return (
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
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estadoProducto.clase}`}>
                    {estadoProducto.texto}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <ProductCatalogFeaturedToggle
                    producto={producto}
                    disabled={destacadoDeshabilitado(producto, destacadosEnUso, maxDestacados, puedeDestacarse)}
                    onToggle={() => onToggleDestacado(producto)}
                  />
                </td>
                <td className="px-6 py-4 align-top">{renderAcciones(producto, "table")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
