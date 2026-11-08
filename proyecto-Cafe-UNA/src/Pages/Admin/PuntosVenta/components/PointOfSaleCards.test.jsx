import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleCards } from "./PointOfSaleCards";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }) => <a className={className}>{children}</a>,
}));

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

describe("PointOfSaleCards color roles", () => {
  it("marks the selected card with coffee soft background and coffee border, not black", () => {
    const { container } = render(
      <PointOfSaleCards locations={locations} selectedCode="POS_FUNA_UNA" onSelect={vi.fn()} canManage onEdit={vi.fn()} onToggleActivo={vi.fn()} />,
    );
    const [selected, other] = container.querySelectorAll("article");
    expect(selected.className).toContain("admin-role-selected");
    expect(selected.className).not.toMatch(/slate-950|text-white/);
    expect(other.className).toContain("admin-role-surface");
  });

  it("keeps row actions quiet and the destructive action transparent with danger text", () => {
    render(<PointOfSaleCards locations={locations} selectedCode="POS_FUNA_UNA" onSelect={vi.fn()} canManage onEdit={vi.fn()} onToggleActivo={vi.fn()} />);
    const editar = screen.getAllByRole("button", { name: /Editar/i })[0];
    expect(editar.className).toContain("admin-role-quiet");
    expect(editar.className).not.toMatch(/slate-950|bg-white |text-white/);
    const inactivar = screen.getByRole("button", { name: /Inactivar/i });
    expect(inactivar.className).toContain("admin-role-danger");
    const activar = screen.getByRole("button", { name: /^Activar/i });
    expect(activar.className).toContain("admin-role-positive");
  });
});
