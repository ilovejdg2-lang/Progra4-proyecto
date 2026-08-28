import { ADMIN_PAGE_SIZE } from "../../../hooks/useAdminPaginacion";

export function AdminPaginacion({
  page,
  totalPages,
  total,
  onChange,
  pageSize = ADMIN_PAGE_SIZE,
  label = "Paginaci\u00f3n",
}) {
  if (!total || total <= pageSize || totalPages <= 1) return null;

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
        Anterior
      </button>

      {Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        const activa = pageNumber === page;
        return (
          <button
            key={pageNumber}
            type="button"
            className={`inline-flex h-[var(--control-height)] min-w-[var(--control-height)] items-center justify-center rounded-full border px-3 text-[length:var(--text-body)] font-semibold transition ${
              activa
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => onChange(pageNumber)}
            aria-current={activa ? "page" : undefined}
          >
            {pageNumber}
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
        Siguiente
      </button>
    </nav>
  );
}
