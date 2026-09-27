import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useTraducir } from "../../hooks/useTraducir";
import "./Select.css";

function TextoOpcion({ texto }) {
  return useTraducir(texto || "");
}

function EtiquetaOpcion({ texto, traducir }) {
  return traducir ? <TextoOpcion texto={texto} /> : texto || "";
}

function claveBusqueda(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarOpciones(options) {
  return (Array.isArray(options) ? options : []).map((opcion) => {
    if (opcion != null && typeof opcion === "object") {
      return {
        value: opcion.value,
        label: opcion.label ?? String(opcion.value ?? ""),
        ...opcion,
      };
    }
    return { value: opcion, label: String(opcion ?? "") };
  });
}

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
  buscable = false,
  placeholderBusqueda = "Buscar...",
  traducirOpciones = true,
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const generatedId = useId();
  const triggerId = id || generatedId;
  const tPlaceholderBusqueda = useTraducir(placeholderBusqueda);
  const opciones = normalizarOpciones(options);
  const actual = opciones.find((opcion) => opcion.value === value) ?? opciones[0];
  const filtro = buscable ? claveBusqueda(busqueda.trim()) : "";
  const opcionesVisibles = filtro
    ? opciones.filter((opcion) => claveBusqueda(opcion.label).includes(filtro))
    : opciones;

  useEffect(() => {
    if (open && buscable) searchRef.current?.focus();
  }, [open, buscable]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return undefined;
    }

    const sync = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportPad = 8;
      const gap = 6;
      const preferred = Math.min(288, window.innerHeight * 0.55);
      const spaceBelow = Math.max(96, window.innerHeight - rect.bottom - viewportPad - gap);
      const maxHeight = Math.min(preferred, spaceBelow);
      const width = Math.max(rect.width, footer ? 264 : rect.width);
      let left = rect.left;
      if (left + width > window.innerWidth - viewportPad) {
        left = Math.max(viewportPad, window.innerWidth - width - viewportPad);
      }
      // Siempre debajo del trigger para no tapar etiquetas (ROL, ESTADO, etc.).
      setMenuStyle({
        position: "fixed",
        top: `${rect.bottom + gap}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: 100030,
      });
    };

    sync();
    const rafId = window.requestAnimationFrame(sync);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, footer, opciones.length]);

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
    document.addEventListener("pointerdown", cerrar);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", cerrar);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const elegir = (opcion) => {
    onChange?.(opcion.value);
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
        onClick={() => {
          setBusqueda("");
          setOpen((actualOpen) => !actualOpen);
        }}
      >
        <span className="ui-select__value">
          {actual?.label ? <EtiquetaOpcion texto={actual.label} traducir={traducirOpciones} /> : null}
        </span>
        <ChevronDown className="ui-select__chevron" size={16} aria-hidden="true" />
      </button>
      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              className={`ui-select__menu ui-select__menu--portal${className ? ` ${className}` : ""}`}
              style={menuStyle}
            >
              {buscable ? (
                <div className="ui-select__search">
                  <input
                    ref={searchRef}
                    type="search"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && opcionesVisibles.length > 0) {
                        event.preventDefault();
                        elegir(opcionesVisibles[0]);
                      }
                    }}
                    placeholder={tPlaceholderBusqueda}
                    aria-label={tPlaceholderBusqueda}
                    className="ui-select__search-input"
                  />
                </div>
              ) : null}
              <ul className="ui-select__options" role="listbox" aria-labelledby={triggerId}>
                {opcionesVisibles.map((opcion) => (
                  <li key={String(opcion.value)} className="ui-select__option-row">
                    <span
                      role="option"
                      tabIndex={0}
                      aria-selected={opcion.value === value}
                      className={`ui-select__option${opcion.value === value ? " is-selected" : ""}`}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        elegir(opcion);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          elegir(opcion);
                        }
                      }}
                    >
                      <EtiquetaOpcion texto={opcion.label} traducir={traducirOpciones} />
                    </span>
                    {renderOptionEnd?.(opcion)}
                  </li>
                ))}
                {buscable && opcionesVisibles.length === 0 ? (
                  <li className="ui-select__empty"><TextoOpcion texto="Sin resultados" /></li>
                ) : null}
              </ul>
              {footer ? <div className="ui-select__footer">{footer}</div> : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
