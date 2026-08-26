import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleCards } from "./PointOfSaleCards";

const locations = [
  { code: "POS_FUNA_UNA", name: "FUNA-UNA", activo: true },
  { code: "POS_EDITORIAL", name: "Editorial", activo: false },
];

describe("PointOfSaleCards", () => {
  it("selects a POS with an accessible pressed state and real status badge", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PointOfSaleCards locations={locations} selectedCode="POS_FUNA_UNA" onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: /FUNA-UNA/i }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Editorial/i }));
    expect(onSelect).toHaveBeenCalledWith("POS_EDITORIAL");
  });

  it("exposes manage actions when allowed", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onToggleActivo = vi.fn();
    render(
      <PointOfSaleCards
        locations={locations}
        selectedCode="POS_FUNA_UNA"
        onSelect={vi.fn()}
        canManage
        onEdit={onEdit}
        onToggleActivo={onToggleActivo}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /Editar/i })[0]);
    expect(onEdit).toHaveBeenCalledWith(locations[0]);
    await user.click(screen.getByRole("button", { name: /Inactivar/i }));
    expect(onToggleActivo).toHaveBeenCalledWith(locations[0]);
  });
});
