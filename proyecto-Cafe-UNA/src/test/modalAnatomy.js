import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

/**
 * Asserts the approved admin modal anatomy: close button in the header (same row as the title),
 * Cancelar before the primary action in DOM order, primary in the coffee variant.
 */
export async function expectApprovedModalAnatomy(dialog, { onClose, primaryName }) {
  const header = dialog.querySelector("header");
  expect(header).toBeTruthy();
  const heading = within(header).getByRole("heading", { level: 2 });
  const close = within(header).getByRole("button", { name: "Cerrar" });
  expect(header.firstElementChild.contains(heading)).toBe(true);
  expect(heading.closest("header")).toBe(close.closest("header"));

  const footer = dialog.querySelector("footer");
  expect(footer).toBeTruthy();
  const buttons = within(footer).getAllByRole("button");
  const cancel = within(footer).getByRole("button", { name: "Cancelar" });
  const primary = within(footer).getByRole("button", { name: primaryName });
  expect(buttons.indexOf(cancel)).toBeLessThan(buttons.indexOf(primary));
  expect(primary.className).toContain("bg-[var(--admin-accent-coffee)]");
  expect(cancel.className).toContain("border-[var(--admin-border-input)]");

  await userEvent.setup().click(close);
  if (onClose) expect(onClose).toHaveBeenCalledTimes(1);
}
