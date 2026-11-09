import { Pencil } from "lucide-react";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";
import { ProductThumb } from "../../../../Components/Admin/ui/ProductThumb";
import { StatusDot } from "../../../../Components/Admin/ui/StatusDot";
import { StockCell } from "../../../../Components/Admin/ui/StockCell";

const muted = "text-[color:var(--admin-text-muted)]";
const primary = "text-[color:var(--admin-text-primary)]";

function ProductStatus({ estado }) {
  const habilitado = estado === "Habilitado";
  return (
    <span className={`inline-flex items-center gap-2 ${muted}`}>
      <StatusDot tone={habilitado ? "success" : "neutral"} />
      <ST>{estado}</ST>
    </span>
  );
}

function EditPencil({ product, onEdit }) {
  const tEditar = useTraducir("Editar stock de");
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onEdit(product);
      }}
      aria-label={`${tEditar} ${product.nombre}`}
      className={`inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full! ${muted} transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[color:var(--admin-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]`}
    >
      <Pencil className="size-4" aria-hidden="true" />
    </button>
  );
}

const rowInteractive = "cursor-pointer transition-colors hover:bg-[var(--admin-surface-hover)]";

export function PointOfSaleStockTable({ products, stockByProductId, stockLoading = false, canEdit = false, onEdit }) {
  if (products.length === 0) {
    return (
      <div className={`px-4 py-12 text-center text-[length:var(--text-body)] sm:px-6 ${muted}`}>
        <ST>No hay productos que coincidan con la búsqueda.</ST>
      </div>
    );
  }

  const openRow = canEdit ? onEdit : undefined;

  return (
    <>
      <div className="admin-table-shell admin-table-shell--aligned hidden @xl:block">
        <table className="w-full text-left text-[length:var(--text-body)]">
          <thead>
            <tr className="border-b border-[var(--admin-border)]">
              <th className="px-6 py-3 font-semibold"><ST>Producto</ST></th>
              <th className="px-4 py-3 font-semibold"><ST>Peso</ST></th>
              <th className="px-4 py-3 font-semibold"><ST>Estado</ST></th>
              <th className="px-4 py-3 text-right font-semibold"><ST>Stock</ST></th>
              <th className="w-20 px-4 py-3 pr-6"><span className="sr-only"><ST>Acciones</ST></span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)]">
            {products.map((product) => {
              const stockRecord = stockByProductId.get(String(product.id));
              return (
                <tr key={product.id} onClick={openRow ? () => openRow(product) : undefined} className={canEdit ? rowInteractive : ""}>
                  <td className="px-6 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProductThumb product={product} />
                      <span className={`min-w-0 font-semibold ${primary}`}><ST>{product.nombre}</ST></span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-2 ${muted}`}>{product.peso || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2"><ProductStatus estado={product.estado} /></td>
                  <td className="px-4 py-2 text-right"><StockCell stock={stockRecord?.stock} loading={stockLoading} /></td>
                  <td className="px-4 py-2 pr-6 text-right">{canEdit ? <EditPencil product={product} onEdit={onEdit} /> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-[var(--admin-border)] @xl:hidden">
        {products.map((product) => {
          const stockRecord = stockByProductId.get(String(product.id));
          return (
            <li
              key={product.id}
              onClick={openRow ? () => openRow(product) : undefined}
              className={`flex min-w-0 items-center gap-3 px-4 py-2 ${canEdit ? rowInteractive : ""}`}
            >
              <ProductThumb product={product} />
              <div className="min-w-0 flex-1">
                <p className={`break-words font-semibold leading-snug ${primary}`}><ST>{product.nombre}</ST></p>
                <p className={`mt-0.5 flex flex-wrap items-center gap-x-2 text-xs ${muted}`}>
                  <span>{product.peso || "—"}</span>
                  <span aria-hidden="true">·</span>
                  <ProductStatus estado={product.estado} />
                </p>
              </div>
              <div className="shrink-0 text-right text-[length:var(--text-body)]">
                <StockCell stock={stockRecord?.stock} loading={stockLoading} />
              </div>
              {canEdit ? <EditPencil product={product} onEdit={onEdit} /> : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
