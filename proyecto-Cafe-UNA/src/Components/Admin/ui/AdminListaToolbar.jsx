import { Search, SlidersHorizontal, X } from "lucide-react";
import { UiSelect } from "../../ui/Select";
import { useTraducir } from "../../../hooks/useTraducir";
import { ST } from "../../T/ST";
import { t } from "../../../lib/t";

const inputCls =
  "h-[var(--control-height)] w-full min-w-0 max-w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

const inputFechaCls =
  "h-[var(--control-height)] w-full min-w-0 max-w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

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
  ocultarBusqueda = false,
}) {
  const tPlaceholder = useTraducir(placeholder);
  const tBuscar = useTraducir("Buscar");
  const tMostrando = useTraducir("Mostrando");
  const tDe = useTraducir("de");
  const tRegistro = useTraducir("registro");
  const tRegistros = useTraducir("registros");
  const tLimpiar = useTraducir("Limpiar filtros");

  const indiceFooter = filtros.findIndex((filtro) => filtro.footer);
  const indiceAnchoCompleto =
    filtros.length % 2 === 1
      ? indiceFooter >= 0
        ? indiceFooter
        : filtros.length - 1
      : -1;

  return (
    <div
      className={`relative min-w-0 space-y-4 overflow-visible border-b border-slate-100 bg-transparent ${
        compacto ? "px-4 py-5 sm:px-6" : "px-4 py-5 sm:px-6"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col items-stretch gap-4 xl:flex-row xl:items-end xl:justify-center">
        {ocultarBusqueda ? null : (
        <div className="relative w-full min-w-0 xl:max-w-md xl:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
            placeholder={tPlaceholder}
            className={inputCls}
            aria-label={tBuscar}
          />
        </div>
        )}

        {filtros.length > 0 ? (
          <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-end sm:justify-center xl:w-auto">
            {filtros.map((filtro, indice) => {
              const ocupaDos = filtros.length === 1 || indice === indiceAnchoCompleto;
              return (
              <div
                key={filtro.id}
                className={`relative grid min-w-0 gap-1.5 ${
                  ocupaDos ? "col-span-2 sm:flex-1" : "col-span-1 sm:flex-1"
                } ${filtro.footer || ocupaDos ? "sm:max-w-[18rem]" : "sm:max-w-[12.5rem]"}`}
              >
                <span className="inline-flex items-center gap-1 text-[length:var(--text-body)] font-semibold uppercase tracking-wide text-neutral-500">
                  <SlidersHorizontal className="size-3.5 shrink-0" aria-hidden="true" />
                  <ST>{filtro.label}</ST>
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
                    options={(filtro.opciones || []).map((op) =>
                      typeof op === "string"
                        ? op
                        : { ...op, label: t(op.label) },
                    )}
                    footer={filtro.footer}
                    renderOptionEnd={filtro.renderOptionEnd}
                  />
                )}
              </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {extra ? (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-end">
          {extra}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 text-[length:var(--text-body)] text-slate-500">
        <p>
          {hayFiltrosActivos ? (
            <>
              {tMostrando} <strong className="text-slate-700">{visibles}</strong> {tDe}{" "}
              <strong className="text-slate-700">{total}</strong>
            </>
          ) : (
            <>
              <strong className="text-slate-700">{total}</strong>{" "}
              {total === 1 ? tRegistro : tRegistros}
            </>
          )}
        </p>

        {hayFiltrosActivos && onLimpiar ? (
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex h-[var(--control-height)] items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[length:var(--text-body)] font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <X className="size-3.5" aria-hidden="true" />
            {tLimpiar}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminListaVacia({ mensaje = "No hay resultados con los filtros actuales.", onLimpiar }) {
  return (
    <div className="px-4 py-12 text-center sm:px-6">
      <p className="text-[length:var(--text-body)] text-slate-500"><ST>{mensaje}</ST></p>
      {onLimpiar ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="mt-3 text-[length:var(--text-body)] font-semibold text-slate-800 underline-offset-2 hover:underline"
        >
          <ST>Limpiar filtros</ST>
        </button>
      ) : null}
    </div>
  );
}
