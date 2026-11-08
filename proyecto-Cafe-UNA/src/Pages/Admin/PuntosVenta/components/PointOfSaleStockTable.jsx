import { Package, Pencil } from "lucide-react";
import { imagenPrincipalProducto } from "../../../../lib/productoImagenes";
import { indicadorStockCantidad } from "../../../../lib/productoDisponibilidad";
import { ST } from "../../../../Components/T/ST";
import { FotoMini } from "../../../../Components/FotoMini";
import { t } from "../../../../lib/t";
import { StatusDot } from "./StatusDot";

const muted = "text-[color:var(--admin-text-muted)]";
const primary = "text-[color:var(--admin-text-primary)]";

function ProductImage({ product }) {
  const foto = imagenPrincipalProducto(product);
  return (
    <FotoMini
      src={foto}
      alt=""
      className="size-10 shrink-0 rounded-md object-cover ring-1 ring-[var(--admin-border)]"
      fallback={
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--admin-surface-hover)] ${muted}`}
          role="img"
          aria-label={t("Producto sin imagen")}
        >
          <Package className="size-4" aria-hidden="true" />
        </span>
      }
    />
  );
}

function ProductStatus({ estado }) {
  const habilitado = estado === "Habilitado";
  return (
    <span className={`inline-flex items-center gap-2 ${muted}`}>
      <StatusDot tone={habilitado ? "success" : "neutral"} />
      <ST>{estado}</ST>
    </span>
  );
}

/** Number first, tabular. Amber dot plus a word marks low stock; everything else stays neutral. */
function StockCell({ stockRecord, loading }) {
  const indicador = indicadorStockCantidad(loading ? undefined : stockRecord?.stock, loading);
  if (loading || stockRecord?.stock === null || stockRecord?.stock === undefined) {
    return <span className={muted}>{indicador.etiqueta}</span>;
  }
  const low = indicador.codigo === "pocas" || indicador.codigo === "agotado";
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {low ? (
        <span className={`inline-flex items-center gap-1.5 text-xs ${muted}`}>
          <StatusDot tone="warning" />
          <ST>{indicador.codigo === "agotado" ? "Agotado" : "Bajo"}</ST>
        </span>
      ) : null}
      <span className={`min-w-[2ch] text-right font-semibold tabular-nums ${primary}`}>{indicador.etiqueta}</span>
    </span>
  );
}

function EditPencil({ product, onEdit }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onEdit(product);
      }}
      aria-label={`${t("Editar stock de")} ${product.nombre}`}
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
                      <ProductImage product={product} />
                      <span className={`min-w-0 font-semibold ${primary}`}><ST>{product.nombre}</ST></span>
                    </div>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-2 ${muted}`}>{product.peso || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2"><ProductStatus estado={product.estado} /></td>
                  <td className="px-4 py-2 text-right"><StockCell stockRecord={stockRecord} loading={stockLoading} /></td>
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
              <ProductImage product={product} />
              <div className="min-w-0 flex-1">
                <p className={`break-words font-semibold leading-snug ${primary}`}><ST>{product.nombre}</ST></p>
                <p className={`mt-0.5 flex flex-wrap items-center gap-x-2 text-xs ${muted}`}>
                  <span>{product.peso || "—"}</span>
                  <span aria-hidden="true">·</span>
                  <ProductStatus estado={product.estado} />
                </p>
              </div>
              <div className="shrink-0 text-right text-[length:var(--text-body)]">
                <StockCell stockRecord={stockRecord} loading={stockLoading} />
              </div>
              {canEdit ? <EditPencil product={product} onEdit={onEdit} /> : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
