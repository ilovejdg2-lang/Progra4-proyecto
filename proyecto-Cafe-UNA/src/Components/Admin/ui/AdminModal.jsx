import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useAdminModalLock } from "../../../hooks/useBodyScrollLock";

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
  useAdminModalLock(open);

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
  }, [open, onClose, elevated]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={cn("admin-modal-root", elevated && "is-elevated")}>
      <div
        className="admin-modal-backdrop"
        aria-hidden="true"
        onClick={onClose}
        onWheel={(event) => event.preventDefault()}
        onTouchMove={(event) => event.preventDefault()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full min-h-0 min-w-0 max-w-full flex-col overflow-x-hidden overflow-hidden bg-white shadow-2xl",
          "rounded-t-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl",
          maxWidth,
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
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
        "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-5",
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
  "w-full rounded-full border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

// Shared with the buttons in Voluntariado; CMS editors opt in instead of
// maintaining a second copy of the same visual treatment.
export const adminBtnVoluntariadoPrimary =
  "inline-flex items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60";

export const adminBtnVoluntariadoCancel =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

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
  buttonStyle,
  className,
}) {
  const usesVoluntariadoStyle = buttonStyle === "voluntariado";

  return (
    <div className={cn("flex flex-row flex-wrap justify-end gap-3 sm:gap-4", className)}>
      <button
        type={primaryType}
        disabled={primaryDisabled}
        onClick={onPrimary}
        className={primaryClassName || (usesVoluntariadoStyle ? adminBtnVoluntariadoPrimary : adminBtnPrimary)}
      >
        {primaryLabel}
      </button>
      <button type="button" onClick={onCancel} className={cancelClassName || (usesVoluntariadoStyle ? adminBtnVoluntariadoCancel : adminBtnCancel)}>
        {cancelLabel}
      </button>
    </div>
  );
}
