import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

/**
 * Asserts the approved admin modal anatomy: close button in the header after the title,
 * Cancelar before the primary action in DOM order, primary in the coffee variant.
 *
 * - `onClose` (a mock) is required: the close button must call it exactly once. Modals that close
 *   through internal state (no onClose prop) pass `afterClose` instead, which must verify the close.
 * - `primaryName` selects the footer primary action. Omit it for modals whose footer has no
 *   cancel/primary pair (e.g. a lone "Cerrar" button); only the header is asserted then.
 * - `form` (default true) asserts the primary submits an enclosing form and Cancelar does not.
 */
export async function expectApprovedModalAnatomy(dialog, { onClose, afterClose, primaryName, form = true } = {}) {
  if (!onClose && !afterClose) throw new Error("expectApprovedModalAnatomy requires an onClose mock");

  const header = dialog.querySelector("header");
  expect(header).toBeTruthy();
  const heading = within(header).getByRole("heading", { level: 2 });
  const close = within(header).getByRole("button", { name: "Cerrar" });
  expect(header.firstElementChild.contains(heading)).toBe(true);
  expect(heading.closest("header")).toBe(close.closest("header"));
  expect(heading.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

  const footer = dialog.querySelector("footer");
  expect(footer).toBeTruthy();

  if (primaryName !== undefined) {
    const buttons = within(footer).getAllByRole("button");
    const cancel = within(footer).getByRole("button", { name: /cancelar/i });
    const primary = within(footer).getByRole("button", { name: primaryName });
    expect(buttons.indexOf(cancel)).toBeLessThan(buttons.indexOf(primary));
    expect(primary.className).toContain("bg-[var(--admin-accent-coffee)]");
    expect(cancel).toHaveAttribute("type", "button");
    if (form) {
      expect(primary).toHaveAttribute("type", "submit");
      expect(primary.form).not.toBeNull();
    }
  }

  await userEvent.setup().click(close);
  if (onClose) expect(onClose).toHaveBeenCalledTimes(1);
  if (afterClose) await afterClose();
}
