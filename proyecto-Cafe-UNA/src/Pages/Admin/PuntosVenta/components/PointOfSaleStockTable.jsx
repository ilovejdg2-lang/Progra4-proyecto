import { Edit3, Package } from "lucide-react";
import { imagenPrincipalProducto } from "../../../../lib/productoImagenes";
import { indicadorStockCantidad } from "../../../../lib/productoDisponibilidad";

function ProductImage({ product }) {
  const foto = imagenPrincipalProducto(product);
  return foto ? (
    <img src={foto} alt={product.nombre} className="size-12 rounded-xl object-cover ring-1 ring-slate-200" />
  ) : (
    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400" aria-label="Producto sin imagen">
      <Package className="size-5" aria-hidden="true" />
    </span>
  );
}

function StockCell({ stockRecord, loading }) {
  const indicador = indicadorStockCantidad(
    loading ? undefined : stockRecord?.stock,
    loading,
  );
  if (loading) {
    return <span className={indicador.clase}>{indicador.etiqueta}</span>;
  }
  if (stockRecord?.stock === null || stockRecord?.stock === undefined) {
    return <span className={indicador.clase}>{indicador.etiqueta}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${indicador.clase}`}>
      <span className={`size-2.5 rounded-full ${indicador.punto}`} aria-hidden="true" />
      {indicador.etiqueta}
    </span>
  );
}

export function PointOfSaleStockTable({ products, stockByProductId, stockLoading = false, canEdit = false, onEdit }) {
  if (products.length === 0) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">No hay productos que coincidan con la búsqueda.</div>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Peso</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Stock POS</th>
              {canEdit ? <th className="px-6 py-4">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockRecord = stockByProductId.get(String(product.id));
              return (
                <tr key={product.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3"><ProductImage product={product} /><span className="font-semibold text-slate-900">{product.nombre}</span></div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{product.peso || "—"}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-semibold ${product.estado === "Habilitado" ? "text-green-700" : "text-red-600"}`}>{product.estado}</span></td>
                  <td className="px-6 py-4"><StockCell stockRecord={stockRecord} loading={stockLoading} /></td>
                  {canEdit ? <td className="px-6 py-4"><EditButton product={product} onEdit={onEdit} /></td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {products.map((product) => {
          const stockRecord = stockByProductId.get(String(product.id));
          return (
            <article key={product.id} className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-3"><ProductImage product={product} /><div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-900">{product.nombre}</h3><p className="mt-1 text-xs text-slate-500">{product.descripcion || "Sin descripción"}</p></div></div>
              <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Estado</dt><dd className={`mt-1 text-xs font-semibold ${product.estado === "Habilitado" ? "text-green-700" : "text-red-600"}`}>{product.estado}</dd></div><div><dt className="text-xs text-slate-500">Stock POS</dt><dd className="mt-1"><StockCell stockRecord={stockRecord} loading={stockLoading} /></dd></div></dl>
              {canEdit ? <EditButton product={product} onEdit={onEdit} fullWidth /> : null}
            </article>
          );
        })}
      </div>
    </>
  );
}

function EditButton({ product, onEdit, fullWidth = false }) {
  return <button type="button" onClick={() => onEdit(product)} aria-label={`Editar stock de ${product.nombre}`} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${fullWidth ? "w-full" : ""}`}><Edit3 className="size-4" aria-hidden="true" />Editar stock</button>;
}
