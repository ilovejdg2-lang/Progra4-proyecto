import { useEffect } from "react";

import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function AdminModal({
  open = true,
  onClose,
  children,
  maxWidth = "max-w-2xl",
  className,
  labelledBy,
  elevated = false,
}) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || !onClose) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, elevated);
    return () => window.removeEventListener("keydown", handleKeyDown, elevated);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className={cn("fixed inset-0 flex items-end justify-center sm:items-center sm:p-4", elevated ? "z-[60]" : "z-50")}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full min-h-0 flex-col overflow-hidden bg-white shadow-2xl",
          "rounded-t-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl",
          maxWidth,
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function AdminModalHeader({ children, className }) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6",
        className,
      )}
    >
      {children}
    </header>
  );
}

export function AdminModalBody({ children, className, cms = false }) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5",
        cms && "admin-modal-body--cms",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const adminBtnCancel =
  "w-full rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto";

export const adminBtnPrimary =
  "w-full rounded-full bg-[#a7532d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#8c3d1f] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function AdminModalFooter({ children, className }) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-row flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-4 sm:gap-3 sm:px-6",
        className,
      )}
    >
      {children}
    </footer>
  );
}

export function AdminModalActions({
  onCancel,
  cancelLabel = "Cancelar",
  primaryLabel,
  primaryDisabled = false,
  primaryType = "submit",
  onPrimary,
  primaryClassName,
  cancelClassName,
}) {
  return (
    <>
      <button
        type={primaryType}
        disabled={primaryDisabled}
        onClick={onPrimary}
        className={primaryClassName || adminBtnPrimary}
      >
        {primaryLabel}
      </button>
      <button type="button" onClick={onCancel} className={cancelClassName || adminBtnCancel}>
        {cancelLabel}
      </button>
    </>
  );
}
