import { useId, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTraducir } from "../../../hooks/useTraducir";
import { ST } from "../../T/ST";
import { t } from "../../../lib/t";
import { UiSelect } from "../../ui/Select";

const inputCls =
  "h-[var(--control-height)] w-full min-w-0 max-w-full rounded-[var(--admin-control-radius)] border border-[var(--admin-border-input)] bg-[var(--admin-surface)] py-2 pl-9 pr-3 text-[length:var(--text-body)] text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] outline-none transition-colors";

const inputFechaCls =
  "h-[var(--control-height)] w-full min-w-0 max-w-full rounded-[var(--admin-control-radius)] border border-[var(--admin-border-input)] bg-[var(--admin-surface)] px-3 py-2 text-[length:var(--text-body)] text-[var(--admin-text-primary)] transition-colors focus-visible:border-[var(--admin-focus-ring)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]";

const VALORES_SIN_FILTRO = new Set(["", "todos", "todas"]);

function filtroActivo(filtro) {
  return !VALORES_SIN_FILTRO.has(filtro.value ?? "");
}

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
  const tFiltros = useTraducir("Filtros");
  const filtrosActivos = filtros.filter(filtroActivo).length;
  // Start open on small screens when filters are already active, so they are not hidden on arrival.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(() => filtrosActivos > 0);
  const panelFiltrosId = useId();

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
      <div className={filaClassName || "flex w-full max-w-6xl min-w-0 flex-col items-stretch gap-4 xl:flex-row xl:flex-wrap xl:items-end"}>
        {ocultarBusqueda && filtros.length === 0 ? null : (
        <div className="flex w-full min-w-0 items-center gap-2 xl:w-auto xl:min-w-[16rem] xl:max-w-md xl:flex-1">
          {ocultarBusqueda ? null : (
          <div className="relative min-w-0 flex-1">
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
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((abierto) => !abierto)}
              aria-expanded={filtrosAbiertos}
              aria-controls={panelFiltrosId}
              className="inline-flex h-[var(--control-height)] shrink-0 items-center gap-1.5 rounded-full! border border-[var(--admin-border-input)] bg-[var(--admin-surface)] px-4 text-[length:var(--text-body)] font-semibold text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] focus-visible:border-[var(--admin-focus-ring)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)] lg:hidden"
            >
              <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">{filtrosActivos > 0 ? `${tFiltros} · ${filtrosActivos}` : tFiltros}</span>
            </button>
          ) : null}
        </div>
        )}

        {filtros.length > 0 ? (
          <div id={panelFiltrosId} className={`${filtrosAbiertos ? "" : "hidden"} min-w-0 ${extra ? "lg:block xl:order-last xl:basis-full" : "lg:contents"}`}>
          <div className={filtrosContenedorClassName || "grid w-full min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 xl:w-auto"}>
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
                <span className="text-[13px] font-semibold text-[var(--admin-text-muted)]">
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
          </div>
        ) : null}

        {extra ? (
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end xl:ml-auto">
            {extra}
          </div>
        ) : null}
      </div>

      <div className={`mx-auto flex w-full flex-wrap items-center justify-between gap-3 text-xs tabular-nums text-[var(--admin-text-muted)] ${filaClassName ? "" : "max-w-6xl"}`}>
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
