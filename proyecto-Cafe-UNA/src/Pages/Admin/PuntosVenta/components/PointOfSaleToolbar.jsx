import { Search, X } from "lucide-react";

import { UiSelect } from "../../../../Components/ui/Select";
import { useTraducir } from "../../../../hooks/useTraducir";

/**
 * One-row toolbar: search on the left, category and status selects on the right.
 * The "showing X of Y" line only appears while filters are active, so there is never
 * a stray count floating under the search.
 */
export function PointOfSaleToolbar({
  busqueda,
  onBusquedaChange,
  categoria,
  onCategoriaChange,
  categorias,
  estado,
  onEstadoChange,
  hayFiltrosActivos,
  total,
  visibles,
  onLimpiar,
}) {
  const tBuscar = useTraducir("Buscar producto");
  const tPlaceholder = useTraducir("Buscar producto...");
  const tCategoria = useTraducir("Categoría");
  const tEstado = useTraducir("Estado");
  const tMostrando = useTraducir("Mostrando");
  const tDe = useTraducir("de");
  const tLimpiar = useTraducir("Limpiar filtros");

  return (
    <div className="min-w-0 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 flex-col gap-3 @2xl:flex-row @2xl:items-center">
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
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 @2xl:flex @2xl:shrink-0">
          <div className="min-w-0 @2xl:w-44">
            <UiSelect
              ariaLabel={tCategoria}
              value={categoria}
              onChange={onCategoriaChange}
              options={[{ value: "todos", label: "Todas las categorías" }, ...categorias.map((value) => ({ value, label: value }))]}
            />
          </div>
          <div className="min-w-0 @2xl:w-40">
            <UiSelect
              ariaLabel={tEstado}
              value={estado}
              onChange={onEstadoChange}
              options={[
                { value: "todos", label: "Todos los estados" },
                { value: "Habilitado", label: "Habilitado" },
                { value: "Deshabilitado", label: "Deshabilitado" },
              ]}
            />
          </div>
        </div>
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
