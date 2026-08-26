import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import "./Select.css";

export function UiSelect({
  id,
  value,
  onChange,
  options = [],
  disabled = false,
  ariaLabel,
  className = "",
  footer = null,
  renderOptionEnd,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const generatedId = useId();
  const triggerId = id || generatedId;
  const actual = options.find((opcion) => opcion.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const cerrar = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const elegir = (opcion) => {
    onChange(opcion.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`ui-select${open ? " is-open" : ""}${footer ? " has-footer" : ""}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="ui-select__trigger"
        onClick={() => setOpen((actualOpen) => !actualOpen)}
      >
        <span className="ui-select__value">{actual?.label || ""}</span>
        <ChevronDown className="ui-select__chevron" size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className="ui-select__menu">
          <ul className="ui-select__options" role="listbox" aria-labelledby={triggerId}>
            {options.map((opcion) => (
              <li key={String(opcion.value)} className="ui-select__option-row">
                <span
                  role="option"
                  tabIndex={0}
                  aria-selected={opcion.value === value}
                  className={`ui-select__option${opcion.value === value ? " is-selected" : ""}`}
                  onClick={() => elegir(opcion)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      elegir(opcion);
                    }
                  }}
                >
                  {opcion.label}
                </span>
                {renderOptionEnd?.(opcion)}
              </li>
            ))}
          </ul>
          {footer ? <div className="ui-select__footer">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
