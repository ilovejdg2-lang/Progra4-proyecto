import { contarPalabras, etiquetaContadorPalabras } from "../../../lib/formLimits";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/** "3/8 palabras", amber from 90% of the limit and red at the limit (numbers stay visible). */
export function ContadorCampo({ id, value, maxPalabras }) {
  const usados = contarPalabras(value);
  const estado = usados >= maxPalabras ? "limite" : usados >= maxPalabras * 0.9 ? "cerca" : "normal";
  return (
    <span
      id={id}
      data-estado={estado}
      className={cn(
        "shrink-0 text-xs tabular-nums",
        estado === "limite" && "font-semibold text-[var(--admin-status-danger-text)]",
        estado === "cerca" && "font-semibold text-[var(--admin-status-warning-text)]",
        estado === "normal" && "font-medium text-[var(--admin-text-muted)]",
      )}
    >
      {etiquetaContadorPalabras(value, maxPalabras)}
    </span>
  );
}

/** Label row (label left, optional counter right), the control, and an optional hint below. */
export function AdminCampo({ id, label, contador = null, hint, hintId, children, className }) {
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-semibold text-[var(--admin-text-muted)]">
          {label}
        </label>
        {contador}
      </div>
      {children}
      {hint ? (
        <p id={hintId} className="text-xs text-[var(--admin-text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Titled group of fields; consecutive groups are separated by a 1px divider. */
export function AdminFieldset({ legend, children, className }) {
  return (
    <div className="min-w-0 border-t border-[var(--admin-border)] pt-5 first:border-t-0 first:pt-0">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        {legend ? (
          <legend className="mb-3 p-0 text-[length:var(--text-body)] font-bold text-[var(--admin-text-primary)]">{legend}</legend>
        ) : null}
        <div className={cn("grid min-w-0 gap-4", className)}>{children}</div>
      </fieldset>
    </div>
  );
}
