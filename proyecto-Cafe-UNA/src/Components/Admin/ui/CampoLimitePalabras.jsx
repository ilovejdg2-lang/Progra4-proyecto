import {
  conLimitePalabras,
  contarPalabras,
  etiquetaContadorPalabras,
} from "../../../lib/formLimits";
import { useTraducir } from "../../../hooks/useTraducir";

const inputCls =
  "h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-[length:var(--text-body)] font-normal normal-case tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none";

const textareaCls =
  "min-h-[var(--control-height)] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[length:var(--text-body)] font-normal normal-case leading-7 tracking-normal text-slate-950 shadow-none outline-none transition focus:border-slate-400 focus:bg-white focus:shadow-none focus:ring-0 focus:outline-none";

/**
 * Campo de texto/área con tope de palabras y contador visible.
 * No usar en URLs, correos, teléfonos ni contraseñas.
 */
export function CampoLimitePalabras({
  label,
  name,
  value = "",
  onChange,
  maxPalabras,
  multiline = false,
  rows = 4,
  type = "text",
  placeholder,
  hint,
  required = false,
  disabled = false,
  className = "",
  controlClassName = "",
}) {
  const tLabel = useTraducir(label || "");
  const tPlaceholder = useTraducir(placeholder || "");
  const tHint = useTraducir(hint || "");

  if (!maxPalabras || maxPalabras < 1) {
    throw new Error("CampoLimitePalabras requiere maxPalabras > 0");
  }

  const usados = contarPalabras(value);
  const handleChange = conLimitePalabras(onChange, maxPalabras);
  const contador = etiquetaContadorPalabras(value, maxPalabras);
  const cercaDelLimite = usados >= maxPalabras;

  return (
    <label className={`grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 ${className}`.trim()}>
      {tLabel}
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          rows={rows}
          placeholder={tPlaceholder || undefined}
          required={required}
          disabled={disabled}
          className={`${textareaCls} ${controlClassName}`.trim()}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={tPlaceholder || undefined}
          required={required}
          disabled={disabled}
          className={`${inputCls} ${controlClassName}`.trim()}
        />
      )}
      <span
        className={`text-xs font-medium normal-case tracking-normal ${
          cercaDelLimite ? "text-amber-700" : "text-slate-400"
        }`}
      >
        {hint ? `${tHint} · ${contador}` : contador}
      </span>
    </label>
  );
}

export function ContadorPalabras({ value, maxPalabras, className = "" }) {
  const usados = contarPalabras(value);
  return (
    <span
      className={`text-xs font-medium normal-case tracking-normal ${
        usados >= maxPalabras ? "text-amber-700" : "text-slate-400"
      } ${className}`.trim()}
    >
      {etiquetaContadorPalabras(value, maxPalabras)}
    </span>
  );
}
