import { useLayoutEffect, useRef } from "react";
import "./ModalDialog.css";

/**
 * Modal built on the native <dialog> element.
 *
 * The dialog itself is the full-viewport overlay (reset in ModalDialog.css), so each
 * caller keeps its own overlay/panel classes inside. Native modality provides the
 * focus trap, inert background and focus return on close. Open state stays controlled:
 * Escape and backdrop presses call onClose and the caller unmounts or sets open=false.
 *
 * Pass `panel` when the dialog is itself the visible box (e.g. a side drawer) instead of a
 * full-viewport overlay: only presses outside its bounds then count as backdrop presses.
 *
 * Anything portaled to document.body from inside a modal would render behind it (top
 * layer), so portal into the nearest open dialog instead.
 */
function pressedOutsideBox(event) {
  const box = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

export function ModalDialog({
  open = true,
  onClose,
  labelledBy,
  label,
  className = "",
  panel = false,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const pressedBackdrop = useRef(false);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      {...rest}
      ref={ref}
      className={`modal-dialog${className ? ` ${className}` : ""}`}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          // Portaled dialogs bubble through React ancestors: only the topmost one closes.
          event.stopPropagation();
          onClose?.();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current =
          event.target === event.currentTarget && (!panel || pressedOutsideBox(event));
        rest.onPointerDown?.(event);
      }}
      onClick={(event) => {
        const startedOnBackdrop = pressedBackdrop.current;
        pressedBackdrop.current = false;
        if (startedOnBackdrop && event.target === event.currentTarget && (!panel || pressedOutsideBox(event))) {
          onClose?.();
        }
        rest.onClick?.(event);
      }}
    >
      {children}
    </dialog>
  );
}
