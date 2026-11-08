import { render, screen } from "@testing-library/react";
import { beforeEach, describe, it, vi } from "vitest";

import { expectApprovedModalAnatomy } from "../../../../test/modalAnatomy";
import { PointOfSaleLocationEditor } from "./PointOfSaleLocationEditor";

describe("PointOfSaleLocationEditor", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
  });

  it("follows the approved modal anatomy", async () => {
    const onClose = vi.fn();
    render(<PointOfSaleLocationEditor open onClose={onClose} onSave={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Agregar punto de venta" });
    await expectApprovedModalAnatomy(dialog, { onClose, primaryName: "Crear punto" });
  });
});
