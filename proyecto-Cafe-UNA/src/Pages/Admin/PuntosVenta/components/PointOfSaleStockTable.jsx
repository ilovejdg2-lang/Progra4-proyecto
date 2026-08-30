import { Edit3, Package } from "lucide-react";
import { imagenPrincipalProducto } from "../../../../lib/productoImagenes";
import { indicadorStockCantidad } from "../../../../lib/productoDisponibilidad";
import { ST } from "../../../../Components/T/ST";
import { t } from "../../../../lib/t";

function ProductImage({ product }) {
  const foto = imagenPrincipalProducto(product);
  return foto ? (
    <img src={foto} alt={product.nombre} className="size-12 rounded-xl object-cover ring-1 ring-slate-200" />
  ) : (
    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400" aria-label={t("Producto sin imagen")}>
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
    return <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6"><ST>No hay productos que coincidan con la búsqueda.</ST></div>;
  }

  return (
    <>
      <div className="admin-table-shell hidden md:block">
        <table className="w-full min-w-[640px] text-left text-[length:var(--text-body)]">
          <thead>
            <tr>
              <th><ST>Producto</ST></th>
              <th><ST>Peso</ST></th>
              <th><ST>Estado</ST></th>
              <th><ST>Stock POS</ST></th>
              {canEdit ? <th><ST>Acciones</ST></th> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockRecord = stockByProductId.get(String(product.id));
              return (
                <tr key={product.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3"><ProductImage product={product} /><span className="font-semibold text-slate-900"><ST>{product.nombre}</ST></span></div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{product.peso || "—"}</td>
                  <td className="px-6 py-4"><span className={`text-[length:var(--text-body)] font-semibold ${product.estado === "Habilitado" ? "text-green-700" : "text-red-600"}`}><ST>{product.estado}</ST></span></td>
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
              <div className="flex items-start gap-3"><ProductImage product={product} /><div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-900"><ST>{product.nombre}</ST></h3><p className="mt-1 text-xs text-slate-500">{product.descripcion ? <ST>{product.descripcion}</ST> : <ST>Sin descripción</ST>}</p></div></div>
              <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500"><ST>Estado</ST></dt><dd className={`mt-1 text-xs font-semibold ${product.estado === "Habilitado" ? "text-green-700" : "text-red-600"}`}><ST>{product.estado}</ST></dd></div><div><dt className="text-xs text-slate-500"><ST>Stock POS</ST></dt><dd className="mt-1"><StockCell stockRecord={stockRecord} loading={stockLoading} /></dd></div></dl>
              {canEdit ? <EditButton product={product} onEdit={onEdit} fullWidth /> : null}
            </article>
          );
        })}
      </div>
    </>
  );
}

function EditButton({ product, onEdit, fullWidth = false }) {
  return (
    <button
      type="button"
      onClick={() => onEdit(product)}
      aria-label={`${t("Editar stock")} ${product.nombre}`}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${fullWidth ? "w-full" : ""}`}
    >
      <Edit3 className="size-4" aria-hidden="true" />
      <ST>Editar stock</ST>
    </button>
  );
}
