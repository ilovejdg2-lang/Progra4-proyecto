import { Search, X } from "lucide-react";

import { UiSelect } from "../../ui/Select";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";

/**
 * One-row toolbar for admin lists (container-query driven): search on the left, compact selects
 * on the right. The "showing X of Y" line only appears while filters are active, so there is
 * never a stray count floating under the search.
 *
 * filtros: [{ id, ariaLabel, value, onChange, options: [{value,label}], widthClass?, footer?, renderOptionEnd? }]
 */
export function AdminFilterToolbar({
  busqueda,
  onBusquedaChange,
  placeholder = "Buscar...",
  searchLabel = "Buscar",
  filtros = [],
  hayFiltrosActivos,
  total,
  visibles,
  onLimpiar,
}) {
  const tBuscar = useTraducir(searchLabel);
  const tPlaceholder = useTraducir(placeholder);
  const tMostrando = useTraducir("Mostrando");
  const tDe = useTraducir("de");
  const tLimpiar = useTraducir("Limpiar filtros");
  // With an odd count the first select takes the full row on narrow containers so none is orphaned.
  // Three selects are too wide to share a row with the search below @4xl, so they wrap under it.
  const oddFirstWide = filtros.length % 2 === 1 && filtros.length > 1;
  const wrapsUnderSearch = filtros.length > 2;

  return (
    <div className="min-w-0 px-4 py-3 sm:px-6">
      <div className={`flex min-w-0 flex-col gap-3 ${wrapsUnderSearch ? "@4xl:flex-row @4xl:items-center" : "@2xl:flex-row @2xl:items-center"}`}>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--admin-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
            placeholder={tPlaceholder}
            aria-label={tBuscar}
            className="h-[var(--control-height)] w-full min-w-0 rounded-[var(--admin-control-radius)] border border-[var(--admin-border-input)] bg-[var(--admin-surface)] py-2 pl-9 pr-3 text-[length:var(--text-body)] text-[color:var(--admin-text-primary)] outline-none transition-colors placeholder:text-[color:var(--admin-text-muted)] focus-visible:border-[var(--admin-focus-ring)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)] [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
        {filtros.length > 0 ? (
          <div
            className={`grid min-w-0 gap-3 ${
              wrapsUnderSearch
                ? "grid-cols-2 @2xl:grid-cols-3 @4xl:flex @4xl:shrink-0"
                : "grid-cols-1 min-[480px]:grid-cols-2 @2xl:flex @2xl:shrink-0"
            }`}
          >
            {filtros.map((filtro, index) => (
              <div
                key={filtro.id}
                className={`min-w-0 ${oddFirstWide && index === 0 ? "col-span-2 @2xl:col-span-1" : ""} ${filtro.widthClass || "@2xl:w-40"}`}
              >
                <UiSelect
                  ariaLabel={t(filtro.ariaLabel)}
                  value={filtro.value}
                  onChange={filtro.onChange}
                  options={filtro.options}
                  footer={filtro.footer}
                  renderOptionEnd={filtro.renderOptionEnd}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {hayFiltrosActivos ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs tabular-nums text-[color:var(--admin-text-muted)]">
          <span>
            {tMostrando} <strong className="font-semibold text-[color:var(--admin-text-primary)]">{visibles}</strong> {tDe}{" "}
            <strong className="font-semibold text-[color:var(--admin-text-primary)]">{total}</strong>
          </span>
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex min-h-[var(--control-height)] items-center gap-1 rounded-full! px-2 font-semibold text-[color:var(--admin-accent-coffee)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]"
          >
            <X className="size-3.5" aria-hidden="true" />
            {tLimpiar}
          </button>
        </p>
      ) : null}
    </div>
  );
}
