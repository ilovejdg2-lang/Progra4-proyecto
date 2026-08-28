import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const generatedId = useId();
  const triggerId = id || generatedId;
  const actual = options.find((opcion) => opcion.value === value) ?? options[0];

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return undefined;
    }

    const sync = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportPad = 8;
      const gap = 6;
      const preferred = Math.min(288, window.innerHeight * 0.55);
      const spaceBelow = window.innerHeight - rect.bottom - viewportPad - gap;
      const spaceAbove = rect.top - viewportPad - gap;
      const openUp = spaceBelow < Math.min(preferred, 160) && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(96, Math.min(preferred, available));
      const width = Math.max(rect.width, footer ? 264 : rect.width);
      let left = rect.left;
      if (left + width > window.innerWidth - viewportPad) {
        left = Math.max(viewportPad, window.innerWidth - width - viewportPad);
      }
      setMenuStyle({
        position: "fixed",
        top: openUp ? "auto" : `${rect.bottom + gap}px`,
        bottom: openUp ? `${window.innerHeight - rect.top + gap}px` : "auto",
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: 100030,
      });
    };

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, footer, options.length]);

  useEffect(() => {
    if (!open) return undefined;
    const cerrar = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
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
        ref={triggerRef}
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
      {open && menuStyle
        ? createPortal(
            <div ref={menuRef} className="ui-select__menu ui-select__menu--portal" style={menuStyle}>
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
