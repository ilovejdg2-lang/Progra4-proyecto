import { Search, SlidersHorizontal, X } from "lucide-react";
import { UiSelect } from "../../ui/Select";

const inputCls =
  "w-full min-w-0 max-w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

const inputFechaCls =
  "w-full min-w-0 max-w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

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
  extra = null,
}) {
  return (
    <div
      className={`min-w-0 space-y-4 overflow-x-hidden border-b border-slate-100 bg-white ${
        compacto ? "px-4 py-5 sm:px-6" : "px-4 py-5 sm:px-6"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col items-stretch gap-4 xl:flex-row xl:items-end xl:justify-center">
        <div className="relative w-full min-w-0 xl:max-w-md xl:flex-1">
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
          <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-center xl:w-auto">
            {filtros.map((filtro) => (
              <div
                key={filtro.id}
                className={`grid w-full min-w-0 flex-1 gap-1.5 ${
                  filtro.footer ? "sm:max-w-[18rem]" : "sm:max-w-[12.5rem]"
                }`}
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  <SlidersHorizontal className="size-3" aria-hidden="true" />
                  {filtro.label}
                </span>
                {filtro.tipo === "fecha" ? (
                  <input
                    type="date"
                    value={filtro.value}
                    onChange={(event) => filtro.onChange(event.target.value)}
                    className={inputFechaCls}
                  />
                ) : (
                  <UiSelect
                    ariaLabel={filtro.label}
                    value={filtro.value}
                    onChange={filtro.onChange}
                    options={filtro.opciones}
                    footer={filtro.footer}
                    renderOptionEnd={filtro.renderOptionEnd}
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {extra ? (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-end">
          {extra}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
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
          className="mt-3 text-sm font-semibold text-slate-800 underline-offset-2 hover:underline"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
