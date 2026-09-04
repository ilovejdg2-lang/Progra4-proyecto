import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ImageLightbox.css";

export function ImageLightbox({ images, index, onClose, onIndexChange, alt = "" }) {
  const lista = (Array.isArray(images) ? images : []).filter(Boolean);
  const actual = Number.isInteger(index) ? index : -1;
  const abierto = actual >= 0 && actual < lista.length;
  const src = abierto ? lista[actual] : "";
  const hayVarias = lista.length > 1;

  useEffect(() => {
    if (!abierto) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (!hayVarias) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndexChange?.((actual - 1 + lista.length) % lista.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndexChange?.((actual + 1) % lista.length);
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [abierto, actual, hayVarias, lista.length, onClose, onIndexChange]);

  if (!abierto || typeof document === "undefined") return null;

  return createPortal(
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Vista ampliada">
      <button
        type="button"
        className="image-lightbox__backdrop"
        onClick={onClose}
        aria-label="Cerrar vista ampliada"
      />
      <div className="image-lightbox__panel">
        <button type="button" className="image-lightbox__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {hayVarias ? (
          <button
            type="button"
            className="image-lightbox__nav image-lightbox__nav--prev"
            onClick={() => onIndexChange?.((actual - 1 + lista.length) % lista.length)}
            aria-label="Foto anterior"
          >
            ‹
          </button>
        ) : null}
        <figure className="image-lightbox__figure">
          <img src={src} alt={alt || "Fotografía ampliada"} className="image-lightbox__image" />
        </figure>
        {hayVarias ? (
          <button
            type="button"
            className="image-lightbox__nav image-lightbox__nav--next"
            onClick={() => onIndexChange?.((actual + 1) % lista.length)}
            aria-label="Foto siguiente"
          >
            ›
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
