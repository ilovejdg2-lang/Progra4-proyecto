import { ST } from "../../T/ST";
import { ADMIN_PAGE_SIZE } from "../../../hooks/useAdminPaginacion";

/**
 * Paginación del panel admin: Anterior · 1 / N · Siguiente
 */
export function AdminPaginacion({
  page,
  totalPages,
  total,
  onChange,
  pageSize = ADMIN_PAGE_SIZE,
  label = "Paginaci\u00f3n",
}) {
  const totalNum = Number(total) || 0;
  const pages = Math.max(1, Number(totalPages) || 1);
  const actual = Math.min(Math.max(1, Number(page) || 1), pages);

  if (totalNum > 0 && totalNum <= pageSize) return null;
  if (pages <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800"
      aria-label={label}
    >
      <button
        type="button"
        className="inline-flex h-[var(--control-height)] items-center rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        onClick={() => onChange(actual - 1)}
        disabled={actual <= 1}
        aria-label={"P\u00e1gina anterior"}
      >
        <ST>Anterior</ST>
      </button>

      <span className="min-w-[3.5rem] text-center text-[length:var(--text-body)] font-medium text-slate-700 dark:text-slate-200" aria-current="page">
        {actual} / {pages}
      </span>

      <button
        type="button"
        className="inline-flex h-[var(--control-height)] items-center rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        onClick={() => onChange(actual + 1)}
        disabled={actual >= pages}
        aria-label={"P\u00e1gina siguiente"}
      >
        <ST>Siguiente</ST>
      </button>
    </nav>
  );
}
