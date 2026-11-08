import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { ModalDialog } from "../../ui/ModalDialog";
import { useAdminModalLock } from "../../../hooks/useBodyScrollLock";
import { useTraducir } from "../../../hooks/useTraducir";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function AdminModal({
  open = true,
  onClose,
  children,
  maxWidth = "max-w-xl",
  className,
  labelledBy,
  elevated = false,
}) {
  useAdminModalLock(open);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <ModalDialog
      onClose={onClose}
      labelledBy={labelledBy}
      className={cn("admin-modal-root", elevated && "is-elevated")}
    >
      <div
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full min-h-0 min-w-0 flex-col overflow-x-hidden overflow-hidden bg-white shadow-2xl",
          "rounded-t-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl",
          maxWidth,
          className,
        )}
      >
        {children}
      </div>
    </ModalDialog>,
    document.body,
  );
}

/**
 * Header row. Pass `title` (with optional `icon`, `titleId`, `description`) for the
 * structured layout: icon + title + muted subtitle on the left, close button on the right.
 * Without `title`, `children` render as before.
 */
export function AdminModalHeader({ children, className, onClose, icon: Icon, title, titleId, description }) {
  const tCerrar = useTraducir("Cerrar");
  const tDescription = useTraducir(description || "");
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 sm:px-4",
        className,
      )}
    >
      {title ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon ? (
            <Icon size={20} strokeWidth={1.75} className="shrink-0 text-[var(--admin-accent-coffee)]" aria-hidden="true" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-[length:var(--text-subtitle)] font-bold leading-tight text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[var(--admin-text-muted)]">{tDescription}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1 text-[length:var(--text-subtitle)] font-bold">{children}</div>
      )}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label={tCerrar}
          className="inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]"
        >
          <X size={20} strokeWidth={2.4} aria-hidden="true" />
        </button>
      ) : null}
    </header>
  );
}

export function AdminModalBody({ children, className, cms = false }) {
  return (
    <div
      className={cn(
        "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4 sm:py-4",
        cms && "admin-modal-body--cms",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const adminBtnCancel =
  "inline-flex min-h-[var(--control-height)] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-[length:var(--text-body)] font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto";

export const adminBtnPrimary =
  "inline-flex min-h-[var(--control-height)] w-full items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 text-[length:var(--text-body)] font-bold text-white transition hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

// Shared with the buttons in Voluntariado; CMS editors opt in instead of
// maintaining a second copy of the same visual treatment.
export const adminBtnVoluntariadoPrimary =
  "inline-flex min-h-[var(--control-height)] items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 text-[length:var(--text-body)] font-bold text-white transition hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60";

export const adminBtnVoluntariadoCancel =
  "inline-flex min-h-[var(--control-height)] items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-[length:var(--text-body)] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

// Coffee-branded modal actions, opt-in through AdminModalActions variant="coffee".
const focusRingCls =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--admin-focus-ring)]";

export const adminBtnCoffeePrimary = `inline-flex min-h-[var(--control-height)] w-full items-center justify-center rounded-full border border-[var(--admin-accent-coffee)] bg-[var(--admin-accent-coffee)] px-5 text-[length:var(--text-body)] font-bold text-[color:var(--admin-on-accent-coffee)] transition-colors hover:border-[var(--admin-accent-coffee-hover)] hover:bg-[var(--admin-accent-coffee-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${focusRingCls}`;

export const adminBtnCoffeeCancel = `inline-flex min-h-[var(--control-height)] w-full items-center justify-center rounded-full border border-[var(--admin-border-input)] bg-transparent px-5 text-[length:var(--text-body)] font-semibold text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${focusRingCls}`;

// Quiet secondary action (outline, muted text, coffee on hover).
export const adminBtnQuiet = `inline-flex min-h-[var(--control-height)] items-center justify-center gap-1.5 rounded-full border border-[var(--admin-border-input)] bg-transparent px-4 text-[length:var(--text-body)] font-semibold text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-accent-coffee)] hover:text-[var(--admin-accent-coffee)] disabled:cursor-not-allowed disabled:opacity-60 ${focusRingCls}`;

export function AdminModalFooter({ children, className }) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-row flex-wrap justify-end gap-2 border-t border-slate-200 px-3 py-3 sm:gap-3 sm:px-4",
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
  variant,
  className,
}) {
  const usesVoluntariadoStyle = buttonStyle === "voluntariado";
  const tCancel = useTraducir(cancelLabel);
  const tPrimary = useTraducir(primaryLabel || "");

  if (variant === "coffee") {
    // DOM order is Cancelar then primary: left/right on desktop, primary on top when stacked on mobile.
    return (
      <div className={cn("flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3", className)}>
        <button type="button" onClick={onCancel} className={cancelClassName || adminBtnCoffeeCancel}>
          {tCancel}
        </button>
        <button
          type={primaryType}
          disabled={primaryDisabled}
          onClick={onPrimary}
          className={primaryClassName || adminBtnCoffeePrimary}
        >
          {tPrimary}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-row flex-wrap justify-end gap-3 sm:gap-4", className)}>
      <button
        type={primaryType}
        disabled={primaryDisabled}
        onClick={onPrimary}
        className={primaryClassName || (usesVoluntariadoStyle ? adminBtnVoluntariadoPrimary : adminBtnPrimary)}
      >
        {tPrimary}
      </button>
      <button type="button" onClick={onCancel} className={cancelClassName || (usesVoluntariadoStyle ? adminBtnVoluntariadoCancel : adminBtnCancel)}>
        {tCancel}
      </button>
    </div>
  );
}
