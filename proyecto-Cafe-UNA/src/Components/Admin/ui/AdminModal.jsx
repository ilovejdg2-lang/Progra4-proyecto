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
}) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || !onClose) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
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

export function AdminModalBody({ children, className }) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5", className)}>
      {children}
    </div>
  );
}

export function AdminModalFooter({ children, className }) {
  return (
    <footer
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6",
        className,
      )}
    >
      {children}
    </footer>
  );
}
