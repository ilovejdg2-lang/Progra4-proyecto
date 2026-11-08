import { render, screen } from "@testing-library/react";
import { beforeEach, describe, it, vi } from "vitest";

import { expectApprovedModalAnatomy } from "../../../test/modalAnatomy";
import { ActivoFormModal } from "./ActivosFijos";

describe("ActivoFormModal", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
  });

  it("follows the approved modal anatomy", async () => {
    const onClose = vi.fn();
    render(<ActivoFormModal open inicial={null} onClose={onClose} onSave={vi.fn()} isSaving={false} error="" />);

    const dialog = screen.getByRole("dialog", { name: "Agregar activo fijo" });
    await expectApprovedModalAnatomy(dialog, { onClose, primaryName: "Crear activo" });
  });
});
