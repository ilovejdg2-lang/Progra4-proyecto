import { Search, SlidersHorizontal, X } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100";

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100";

export function AdminListaToolbar({
  busqueda,
  onBusquedaChange,
  placeholder = "Buscar...",
  filtros = [],
  total = 0,
  visibles = 0,
  onLimpiar,
  hayFiltrosActivos = false,
  compacto = false,
}) {
  return (
    <div className={`space-y-3 border-b border-slate-100 bg-slate-50/60 ${compacto ? "px-0 py-0" : "px-4 py-4 sm:px-6"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
            placeholder={placeholder}
            className={inputCls}
            aria-label="Buscar"
          />
        </div>

        {filtros.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-center">
            {filtros.map((filtro) => (
              <label key={filtro.id} className="grid min-w-[10rem] gap-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <SlidersHorizontal className="size-3" aria-hidden="true" />
                  {filtro.label}
                </span>
                <select
                  value={filtro.value}
                  onChange={(event) => filtro.onChange(event.target.value)}
                  className={selectCls}
                >
                  {filtro.opciones.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          {hayFiltrosActivos ? (
            <>
              Mostrando <strong className="text-slate-700">{visibles}</strong> de{" "}
              <strong className="text-slate-700">{total}</strong>
            </>
          ) : (
            <>
              <strong className="text-slate-700">{total}</strong>{" "}
              {total === 1 ? "registro" : "registros"}
            </>
          )}
        </p>

        {hayFiltrosActivos && onLimpiar ? (
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <X className="size-3" aria-hidden="true" />
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminListaVacia({ mensaje = "No hay resultados con los filtros actuales.", onLimpiar }) {
  return (
    <div className="px-4 py-12 text-center sm:px-6">
      <p className="text-sm text-slate-500">{mensaje}</p>
      {onLimpiar ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="mt-3 text-sm font-semibold text-amber-800 underline-offset-2 hover:underline"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
