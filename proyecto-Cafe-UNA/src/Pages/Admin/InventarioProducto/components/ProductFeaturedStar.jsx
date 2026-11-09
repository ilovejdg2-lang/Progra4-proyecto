import { useId } from "react";
import { Star } from "lucide-react";

import { useTraducir } from "../../../../hooks/useTraducir";
import { t } from "../../../../lib/t";

/**
 * Featured-in-home toggle: a filled coffee star when featured, an outline muted star when not.
 * `motivo` (Spanish source text) explains why the star is disabled and is exposed as both a
 * tooltip and the accessible description.
 */
export function ProductFeaturedStar({ producto, disabled = false, motivo = null, onToggle }) {
  const descId = useId();
  const tDestacar = useTraducir("Destacar");
  const tEnInicio = useTraducir("en inicio");
  const tQuitar = useTraducir("Quitar");
  const tDeDestacados = useTraducir("de destacados");
  const activo = Boolean(producto.esDestacado);
  const label = activo
    ? `${tQuitar} ${producto.nombre} ${tDeDestacados}`
    : `${tDestacar} ${producto.nombre} ${tEnInicio}`;
  const explicacion = disabled && motivo ? t(motivo) : null;

  return (
    <>
      <button
        type="button"
        aria-pressed={activo}
        aria-label={label}
        aria-describedby={explicacion ? descId : undefined}
        title={explicacion || undefined}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(producto);
        }}
        className={`inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full! transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${
          activo
            ? "text-[color:var(--admin-accent-coffee)]"
            : "text-[color:var(--admin-text-muted)] hover:text-[color:var(--admin-text-primary)]"
        }`}
      >
        <Star className={`size-[1.15rem] ${activo ? "fill-current" : ""}`} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {explicacion ? <span id={descId} className="sr-only">{explicacion}</span> : null}
    </>
  );
}
