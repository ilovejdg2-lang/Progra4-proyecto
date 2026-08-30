import { ST } from "../../T/ST";
import { ADMIN_PAGE_SIZE } from "../../../hooks/useAdminPaginacion";

/**
 * Ventana de páginas con elipsis: 1 … 12 13 14 … 50
 * Siempre muestra primera, última y vecinas de la actual.
 */
function numerosPaginacion(page, totalPages, siblingCount = 1) {
  const total = Math.max(1, Number(totalPages) || 1);
  const actual = Math.min(Math.max(1, Number(page) || 1), total);

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(2, actual - siblingCount);
  const right = Math.min(total - 1, actual + siblingCount);
  const items = [1];

  if (left > 2) items.push("…");
  for (let n = left; n <= right; n += 1) items.push(n);
  if (right < total - 1) items.push("…");
  items.push(total);

  return items;
}

export function AdminPaginacion({
  page,
  totalPages,
  total,
  onChange,
  pageSize = ADMIN_PAGE_SIZE,
  label = "Paginaci\u00f3n",
}) {
  if (!total || total <= pageSize || totalPages <= 1) return null;

  const items = numerosPaginacion(page, totalPages);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 px-4 py-3"
      aria-label={label}
    >
      <button
        type="button"
        className="inline-flex h-[var(--control-height)] items-center rounded-full border border-slate-200 bg-white px-3 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={"P\u00e1gina anterior"}
      >
        <ST>Anterior</ST>
      </button>

      {items.map((item, index) => {
        if (item === "…") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-[var(--control-height)] min-w-[var(--control-height)] items-center justify-center px-1 text-[length:var(--text-body)] font-semibold text-slate-400"
              aria-hidden="true"
            >
              …
            </span>
          );
        }

        const activa = item === page;
        return (
          <button
            key={item}
            type="button"
            className={`inline-flex h-[var(--control-height)] min-w-[var(--control-height)] items-center justify-center rounded-full border px-3 text-[length:var(--text-body)] font-semibold transition ${
              activa
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => onChange(item)}
            aria-current={activa ? "page" : undefined}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        className="inline-flex h-[var(--control-height)] items-center rounded-full border border-slate-200 bg-white px-3 text-[length:var(--text-body)] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={"P\u00e1gina siguiente"}
      >
        <ST>Siguiente</ST>
      </button>
    </nav>
  );
}
