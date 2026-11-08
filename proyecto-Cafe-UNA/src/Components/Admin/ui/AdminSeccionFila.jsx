import { Pencil } from "lucide-react";

import { ST } from "../../T/ST";
import { useTraducir } from "../../../hooks/useTraducir";

/**
 * One editable section as a list row. The row itself is the button, so the
 * "Editar" pill is a visual affordance only (no nested interactive element).
 */
export function AdminSeccionFila({ numero, nombre, resumen, icono: Icon, imagen, onEditar }) {
  const tEditar = useTraducir("Editar");
  const tNombre = useTraducir(nombre);
  const tieneResumen = typeof resumen === "string" && resumen.trim() !== "";

  return (
    <button
      type="button"
      onClick={onEditar}
      aria-label={`${tEditar} ${tNombre}`}
      className="group flex min-h-[var(--control-height)] w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--admin-focus-ring)] sm:gap-4 sm:px-6"
    >
      {numero != null ? (
        <span className="w-5 shrink-0 text-right text-xs tabular-nums text-[var(--admin-text-muted)]">{numero}</span>
      ) : null}

      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--admin-accent-coffee)_10%,transparent)] text-[var(--admin-accent-coffee)]"
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block line-clamp-2 text-[length:var(--text-body)] font-semibold leading-5 text-[var(--admin-text-primary)]">
          <ST>{nombre}</ST>
        </span>
        <span className="mt-0.5 block truncate text-xs text-[var(--admin-text-muted)]">
          {tieneResumen ? <ST>{resumen}</ST> : <span className="italic"><ST>Sin contenido</ST></span>}
        </span>
      </span>

      {/* The hide/show lives on a wrapper: the global unlayered `img { display: block }` in index.css beats Tailwind's layered `hidden` on the <img> itself. */}
      {imagen ? (
        <span aria-hidden="true" className="hidden shrink-0 sm:block">
          <img
            src={imagen}
            alt=""
            loading="lazy"
            className="size-9 rounded-md border border-[var(--admin-border)] object-cover"
          />
        </span>
      ) : null}

      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--admin-border)] px-2 py-1 text-xs max-sm:size-8 max-sm:p-0 sm:px-3 font-medium text-[var(--admin-text-muted)] transition-colors group-hover:border-[var(--admin-accent-coffee)] group-hover:text-[var(--admin-accent-coffee)] group-focus-visible:border-[var(--admin-accent-coffee)] group-focus-visible:text-[var(--admin-accent-coffee)]"
      >
        <Pencil className="size-3.5" />
        <span className="hidden sm:inline"><ST>Editar</ST></span>
      </span>
    </button>
  );
}
