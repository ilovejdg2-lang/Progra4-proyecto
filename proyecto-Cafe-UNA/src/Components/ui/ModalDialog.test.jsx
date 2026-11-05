import { StrictMode, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ModalDialog } from "./ModalDialog";

function Harness({ onClose = () => {} }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        opener
      </button>
      {open ? (
        <ModalDialog
          labelledBy="dlg-title"
          className="custom"
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        >
          <h2 id="dlg-title">Title</h2>
          <button type="button">inside</button>
        </ModalDialog>
      ) : null}
    </>
  );
}

describe("ModalDialog", () => {
  it("opens as a labelled modal dialog", () => {
    render(<Harness />);

    const dialog = screen.getByRole("dialog", { name: "Title", hidden: true });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAttribute("data-modal", "true");
    expect(dialog).toHaveClass("modal-dialog", "custom");
  });

  it("opens exactly once under StrictMode", () => {
    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );

    expect(document.querySelector("dialog")).toHaveAttribute("open");
  });

  it("closes on Escape without relying on the native cancel", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "inside", hidden: true }), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("routes the native cancel event to onClose instead of closing by itself", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    const cancel = new Event("cancel", { cancelable: true });
    document.querySelector("dialog").dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a backdrop click that started on the backdrop", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const dialog = document.querySelector("dialog");

    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores clicks inside and drags that started inside and ended on the backdrop", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const dialog = document.querySelector("dialog");
    const inside = screen.getByRole("button", { name: "inside", hidden: true });

    fireEvent.pointerDown(inside);
    fireEvent.click(inside);
    fireEvent.pointerDown(inside);
    fireEvent.click(dialog);
    fireEvent.click(dialog);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes the native dialog when unmounted so focus can return to the opener", () => {
    const close = vi.spyOn(HTMLDialogElement.prototype, "close");
    const { unmount } = render(<Harness />);

    unmount();

    expect(close).toHaveBeenCalled();
    close.mockRestore();
  });

  it("in panel mode only presses outside the dialog box count as backdrop presses", () => {
    const onClose = vi.fn();
    render(
      <ModalDialog panel label="Carrito" onClose={onClose}>
        <p>contenido</p>
      </ModalDialog>,
    );
    const dialog = document.querySelector("dialog");
    dialog.getBoundingClientRect = () => ({ left: 100, right: 300, top: 0, bottom: 400, width: 200, height: 400 });

    fireEvent.pointerDown(dialog, { clientX: 150, clientY: 50 });
    fireEvent.click(dialog, { clientX: 150, clientY: 50 });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(dialog, { clientX: 20, clientY: 50 });
    fireEvent.click(dialog, { clientX: 20, clientY: 50 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
