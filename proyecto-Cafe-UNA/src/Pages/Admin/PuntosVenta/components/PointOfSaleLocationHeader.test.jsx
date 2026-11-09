import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleLocationHeader } from "./PointOfSaleLocationHeader";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, to, role }) => <a className={className} href={to} role={role}>{children}</a>,
}));

const active = { code: "POS_EDITORIAL", name: "Editorial", activo: true };
const inactive = { code: "POS_FERIAS", name: "Stand Ferias", activo: false };

const setup = (props = {}) => {
  const handlers = { onEdit: vi.fn(), onToggleActivo: vi.fn().mockResolvedValue(undefined) };
  const user = userEvent.setup();
  render(
    <PointOfSaleLocationHeader
      location={active}
      productCount={5}
      unitCount={118}
      canManage
      {...handlers}
      {...props}
    />,
  );
  return { user, ...handlers };
};

describe("PointOfSaleLocationHeader", () => {
  it("shows the name and a meta line with code, status and computed totals", () => {
    setup();
    expect(screen.getByRole("heading", { level: 2, name: "Editorial" })).toBeInTheDocument();
    expect(screen.getByText("POS_EDITORIAL · Activo · 5 productos en stock · 118 unidades")).toBeInTheDocument();
  });

  it("omits totals that are not available instead of inventing them", () => {
    setup({ productCount: null, unitCount: null });
    expect(screen.getByText("POS_EDITORIAL · Activo")).toBeInTheDocument();
  });

  it("uses singular forms", () => {
    setup({ productCount: 1, unitCount: 1 });
    expect(screen.getByText("POS_EDITORIAL · Activo · 1 producto en stock · 1 unidad")).toBeInTheDocument();
  });

  it("shows Inactivo for inactive locations", () => {
    setup({ location: inactive, productCount: null, unitCount: null });
    expect(screen.getByText("POS_FERIAS · Inactivo")).toBeInTheDocument();
  });

  it("keeps Historial de ventas visible and hides the menu without manage permission", () => {
    setup({ canManage: false });
    expect(screen.getAllByRole("link", { name: "Historial de ventas" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Más acciones/i })).not.toBeInTheDocument();
  });

  it("opens the menu with Editar and Inactivar, and Editar calls onEdit", async () => {
    const { user, onEdit } = setup();
    const trigger = screen.getByRole("button", { name: /Más acciones de Editorial/i });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await user.click(trigger);
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Inactivar" })).toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: "Editar" }));
    expect(onEdit).toHaveBeenCalledWith(active);
  });

  it("asks for confirmation before inactivating and only toggles on confirm", async () => {
    const { user, onToggleActivo } = setup();
    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    await user.click(screen.getByRole("menuitem", { name: "Inactivar" }));
    expect(onToggleActivo).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: /Inactivar Editorial/i })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(onToggleActivo).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    await user.click(screen.getByRole("menuitem", { name: "Inactivar" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Inactivar" }));
    expect(onToggleActivo).toHaveBeenCalledWith(active);
  });

  it("offers Activar for inactive locations without a confirmation step", async () => {
    const { user, onToggleActivo } = setup({ location: inactive, productCount: null, unitCount: null });
    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    expect(screen.queryByRole("menuitem", { name: "Inactivar" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Activar" }));
    expect(onToggleActivo).toHaveBeenCalledWith(inactive);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps color discipline: no filled or bordered red/green buttons outside the menu", () => {
    const { container } = render(
      <PointOfSaleLocationHeader location={active} productCount={5} unitCount={118} canManage onEdit={vi.fn()} onToggleActivo={vi.fn()} />,
    );
    expect(container.innerHTML).not.toMatch(/admin-role-danger|admin-role-positive|admin-role-primary/);
  });
});
