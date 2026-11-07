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
      className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--admin-border)] px-4 py-3"
      aria-label={label}
    >
      <button
        type="button"
        className="inline-flex h-[var(--control-height)] items-center rounded-[var(--admin-control-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[length:var(--text-body)] font-semibold text-[var(--admin-text-primary)] transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus-ring)] disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
        onClick={() => onChange(actual - 1)}
        disabled={actual <= 1}
        aria-label={"P\u00e1gina anterior"}
      >
        <ST>Anterior</ST>
      </button>

      <span className="min-w-[3.5rem] text-center text-[length:var(--text-body)] font-medium text-[var(--admin-text-muted)]" aria-current="page">
        {actual} / {pages}
      </span>

      <button
        type="button"
        className="inline-flex h-[var(--control-height)] items-center rounded-[var(--admin-control-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[length:var(--text-body)] font-semibold text-[var(--admin-text-primary)] transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus-ring)] disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
        onClick={() => onChange(actual + 1)}
        disabled={actual >= pages}
        aria-label={"P\u00e1gina siguiente"}
      >
        <ST>Siguiente</ST>
      </button>
    </nav>
  );
}
