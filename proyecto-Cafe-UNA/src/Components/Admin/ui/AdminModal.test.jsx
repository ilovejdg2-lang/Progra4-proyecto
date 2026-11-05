import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminModal, AdminModalBody, AdminModalHeader } from "./AdminModal";

function renderModal(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  const utils = render(
    <AdminModal onClose={onClose} labelledBy="am-title" {...props}>
      <AdminModalHeader onClose={onClose}>
        <h2 id="am-title">Editar</h2>
      </AdminModalHeader>
      <AdminModalBody>
        <button type="button">Guardar</button>
      </AdminModalBody>
    </AdminModal>,
  );
  return { ...utils, onClose };
}

describe("AdminModal", () => {
  it("is a labelled native modal dialog", () => {
    renderModal();

    const dialog = screen.getByRole("dialog", { name: "Editar", hidden: true });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
  });

  it("closes on Escape", () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(screen.getByRole("button", { name: "Guardar", hidden: true }), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a backdrop press but not on an inner click", () => {
    const { onClose } = renderModal();
    const dialog = screen.getByRole("dialog", { hidden: true });
    const inner = screen.getByRole("button", { name: "Guardar", hidden: true });

    fireEvent.pointerDown(inner);
    fireEvent.click(inner);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks page scroll while open and releases it on unmount, without inerting the app root", () => {
    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);

    const { unmount } = renderModal();
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(root).not.toHaveAttribute("inert");
    expect(root).not.toHaveAttribute("aria-hidden");

    unmount();
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.documentElement).not.toHaveClass("admin-modal-open");
    root.remove();
  });

  it("only closes the topmost modal when an elevated modal is nested", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <AdminModal onClose={outer} labelledBy="outer-title">
        <h2 id="outer-title">Outer</h2>
        <AdminModal elevated onClose={inner} labelledBy="inner-title">
          <h2 id="inner-title">Confirmar</h2>
          <button type="button">Confirmar ahora</button>
        </AdminModal>
      </AdminModal>,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Confirmar ahora", hidden: true }), { key: "Escape" });

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });
});
