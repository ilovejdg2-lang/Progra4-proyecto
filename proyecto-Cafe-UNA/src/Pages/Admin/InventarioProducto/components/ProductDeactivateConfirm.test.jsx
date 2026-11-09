import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductDeactivateConfirm } from "./ProductDeactivateConfirm";

const producto = { id: 7, nombre: "Café en grano" };

describe("ProductDeactivateConfirm", () => {
  it("keeps both actions enabled while idle", () => {
    render(<ProductDeactivateConfirm producto={producto} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Desactivar" })).toBeEnabled();
  });

  it("disables Cancelar and the confirm button while busy", () => {
    render(<ProductDeactivateConfirm producto={producto} busy onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Desactivando..." })).toBeDisabled();
  });
});
