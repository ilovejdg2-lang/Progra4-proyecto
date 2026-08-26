import { Edit3, Package } from "lucide-react";

function stockLabel(stockRecord, loading) {
  if (loading) return "Cargando...";
  if (!stockRecord || stockRecord.stock === null || stockRecord.stock === undefined) return "Sin registro";
  return String(stockRecord.stock);
}

function stockClass(stockRecord, loading) {
  if (loading) return "text-slate-400";
  if (!stockRecord || stockRecord.stock === null || stockRecord.stock === undefined) return "text-slate-500";
  if (stockRecord.stock === 0) return "text-amber-800";
  return "text-slate-950";
}

function ProductImage({ product }) {
  return product.imagen ? (
    <img src={product.imagen} alt={product.nombre} className="size-12 rounded-xl object-cover ring-1 ring-slate-200" />
  ) : (
    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400" aria-label="Producto sin imagen">
      <Package className="size-5" aria-hidden="true" />
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
                  <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.estado === "Habilitado" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.estado}</span></td>
                  <td className={`px-6 py-4 font-semibold ${stockClass(stockRecord, stockLoading)}`}>{stockLabel(stockRecord, stockLoading)}</td>
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
              <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Estado</dt><dd className="mt-1 font-medium text-slate-800">{product.estado}</dd></div><div><dt className="text-xs text-slate-500">Stock POS</dt><dd className={`mt-1 font-semibold ${stockClass(stockRecord, stockLoading)}`}>{stockLabel(stockRecord, stockLoading)}</dd></div></dl>
              {canEdit ? <EditButton product={product} onEdit={onEdit} fullWidth /> : null}
            </article>
          );
        })}
      </div>
    </>
  );
}

function EditButton({ product, onEdit, fullWidth = false }) {
  return <button type="button" onClick={() => onEdit(product)} aria-label={`Editar stock de ${product.nombre}`} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-600 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 ${fullWidth ? "w-full" : ""}`}><Edit3 className="size-4" aria-hidden="true" />Editar stock</button>;
}
