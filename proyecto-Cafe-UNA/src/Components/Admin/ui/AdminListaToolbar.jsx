import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTraducir } from "../../../hooks/useTraducir";
import { ST } from "../../T/ST";
import { t } from "../../../lib/t";
import { UiSelect } from "../../ui/Select";

const inputCls =
  "h-[var(--control-height)] w-full min-w-0 max-w-full rounded-full rounded-[var(--admin-control-radius)] border border-[var(--admin-border-input)] bg-[var(--admin-surface)] py-2 pl-9 pr-3 text-[length:var(--text-body)] text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] outline-none transition-colors focus:border-[var(--admin-focus-ring)] focus:ring-2 focus:ring-[var(--admin-focus-ring)]/20";

const inputFechaCls =
  "h-[var(--control-height)] w-full min-w-0 max-w-full rounded-full rounded-[var(--admin-control-radius)] border border-[var(--admin-border-input)] bg-[var(--admin-surface)] px-3 py-2 text-[length:var(--text-body)] text-[var(--admin-text-primary)] outline-none transition-colors focus:border-[var(--admin-focus-ring)] focus:ring-2 focus:ring-[var(--admin-focus-ring)]/20";

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
  filtrosContenedorClassName = "",
  filaClassName = "",
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
      className={`relative min-w-0 space-y-4 overflow-visible border-b border-[var(--admin-border)] bg-transparent ${
        compacto ? "px-4 py-5 sm:px-6" : "px-4 py-5 sm:px-6"
      }`}
    >
      <div className={filaClassName || "mx-auto flex w-full max-w-6xl min-w-0 flex-col items-stretch gap-4 xl:flex-row xl:items-end xl:justify-center"}>
        {ocultarBusqueda ? null : (
        <div className="relative w-full min-w-0 xl:max-w-md xl:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-text-muted)]" aria-hidden="true" />
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
          <div className={filtrosContenedorClassName || "grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-end sm:justify-center sm:gap-4 xl:w-auto"}>
            {filtros.map((filtro, indice) => {
              const ocupaDos = filtros.length === 1 || indice === indiceAnchoCompleto;
              return (
              <div
                key={filtro.id}
                className={`relative grid min-w-0 gap-1.5 overflow-visible ${
                  filtro.className
                    || (filtrosContenedorClassName
                      ? "min-w-0"
                      : `${ocupaDos ? "col-span-2" : "col-span-1"} sm:flex-none ${
                          filtro.footer || ocupaDos ? "sm:w-[18rem]" : "sm:w-[12.5rem]"
                        }`)
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
                  <SlidersHorizontal className="size-3 shrink-0" aria-hidden="true" />
                  <ST>{filtro.label}</ST>
                </span>
                {filtro.tipo === "fecha" ? (
                  <input
                    type="date"
                    aria-label={filtro.label}
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
                        ? { value: op, label: t(op) }
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

      <div className={`mx-auto flex w-full flex-wrap items-center justify-between gap-3 text-xs text-[var(--admin-text-muted)] ${filaClassName ? "" : "max-w-6xl"}`}>
        <p>
          {hayFiltrosActivos ? (
            <>
              {tMostrando} <strong className="font-semibold text-[var(--admin-text-primary)]">{visibles}</strong> {tDe}{" "}
              <strong className="font-semibold text-[var(--admin-text-primary)]">{total}</strong>
            </>
          ) : (
            <>
              <strong className="font-semibold text-[var(--admin-text-primary)]">{total}</strong>{" "}
              {total === 1 ? tRegistro : tRegistros}
            </>
          )}
        </p>

        {hayFiltrosActivos && onLimpiar ? (
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex h-[var(--control-height)] items-center gap-1.5 rounded-[var(--admin-control-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 text-xs font-semibold text-[var(--admin-text-primary)] transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus-ring)] shadow-xs"
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
      <p className="text-[length:var(--text-body)] text-[var(--admin-text-muted)]"><ST>{mensaje}</ST></p>
      {onLimpiar ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="mt-3 inline-flex items-center text-[length:var(--text-body)] font-semibold text-[var(--admin-accent-coffee)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus-ring)] rounded-xs"
        >
          <ST>Limpiar filtros</ST>
        </button>
      ) : null}
    </div>
  );
}
