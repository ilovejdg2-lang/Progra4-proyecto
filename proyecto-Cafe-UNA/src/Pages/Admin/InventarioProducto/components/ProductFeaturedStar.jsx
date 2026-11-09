import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";

import { useTraducir } from "../../../../hooks/useTraducir";
import { t } from "../../../../lib/t";

const VIEWPORT_PAD = 8;
const GAP = 6;

/**
 * Featured-in-home toggle: a filled coffee star when featured, an outline muted star when not.
 * `motivo` (Spanish source text) explains why the star is blocked. A blocked star stays focusable
 * (aria-disabled), ignores activation, exposes the reason as its accessible description and shows
 * it visibly on hover, focus and tap.
 */
export function ProductFeaturedStar({ producto, disabled = false, motivo = null, onToggle }) {
  const descId = useId();
  const buttonRef = useRef(null);
  const tipRef = useRef(null);
  const [tipVisible, setTipVisible] = useState(false);
  const [tipHost, setTipHost] = useState(null);
  const [tipStyle, setTipStyle] = useState({ position: "fixed", top: 0, left: 0 });
  const tDestacar = useTraducir("Destacar");
  const tEnInicio = useTraducir("en inicio");
  const tQuitar = useTraducir("Quitar");
  const tDeDestacados = useTraducir("de destacados");
  const activo = Boolean(producto.esDestacado);
  const label = activo
    ? `${tQuitar} ${producto.nombre} ${tDeDestacados}`
    : `${tDestacar} ${producto.nombre} ${tEnInicio}`;
  const explicacion = disabled && motivo ? t(motivo) : null;
  const bloqueado = Boolean(explicacion);

  useLayoutEffect(() => {
    if (!tipVisible || !buttonRef.current || !tipRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const size = tipRef.current.getBoundingClientRect();
    const left = Math.max(
      VIEWPORT_PAD,
      Math.min(rect.left + rect.width / 2 - size.width / 2, window.innerWidth - size.width - VIEWPORT_PAD),
    );
    const fitsBelow = rect.bottom + GAP + size.height <= window.innerHeight - VIEWPORT_PAD;
    const top = fitsBelow ? rect.bottom + GAP : Math.max(VIEWPORT_PAD, rect.top - GAP - size.height);
    setTipStyle({ position: "fixed", top: `${top}px`, left: `${left}px` });
  }, [tipVisible]);

  const hideTip = () => setTipVisible(false);
  // A modal <dialog> sits in the top layer, so the reason must live inside it to stay visible.
  const showTip = () => {
    setTipHost(buttonRef.current?.closest("dialog") ?? null);
    setTipVisible(true);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-pressed={activo}
        aria-label={label}
        aria-describedby={bloqueado ? descId : undefined}
        aria-disabled={bloqueado ? "true" : undefined}
        onMouseEnter={bloqueado ? showTip : undefined}
        onMouseLeave={bloqueado ? hideTip : undefined}
        onFocus={bloqueado ? showTip : undefined}
        onBlur={bloqueado ? hideTip : undefined}
        onKeyDown={bloqueado ? (event) => event.key === "Escape" && hideTip() : undefined}
        onClick={(event) => {
          event.stopPropagation();
          if (bloqueado) {
            showTip();
            return;
          }
          onToggle(producto);
        }}
        className={`inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full! transition-colors hover:bg-[var(--admin-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)] aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${
          activo
            ? "text-[color:var(--admin-accent-coffee)]"
            : "text-[color:var(--admin-text-muted)] hover:text-[color:var(--admin-text-primary)]"
        }`}
      >
        <Star className={`size-[1.15rem] ${activo ? "fill-current" : ""}`} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {bloqueado ? <span id={descId} className="sr-only">{explicacion}</span> : null}
      {bloqueado && tipVisible
        ? createPortal(
            <div
              ref={tipRef}
              data-testid="featured-star-reason"
              aria-hidden="true"
              style={tipStyle}
              className="pointer-events-none z-[100030] w-max max-w-[min(16rem,calc(100vw-1rem))] rounded-[var(--admin-radius-popover)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs leading-snug text-[color:var(--admin-text-primary)] shadow-lg"
            >
              {explicacion}
            </div>,
            tipHost ?? document.body,
          )
        : null}
    </>
  );
}
