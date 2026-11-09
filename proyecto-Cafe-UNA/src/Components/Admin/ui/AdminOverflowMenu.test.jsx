import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminOverflowMenu } from "./AdminOverflowMenu";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, to, ...rest }) => (
    <a className={className} href={to} role={rest.role} onClick={rest.onClick}>{children}</a>
  ),
}));

const setup = (items) => {
  const user = userEvent.setup();
  render(<AdminOverflowMenu label="Más acciones de Editorial" items={items} />);
  return { user, trigger: screen.getByRole("button", { name: "Más acciones de Editorial" }) };
};

describe("AdminOverflowMenu", () => {
  afterEach(() => vi.restoreAllMocks());

  it("exposes menu semantics on the trigger and starts closed", () => {
    const { trigger } = setup([{ key: "a", label: "Editar", onSelect: vi.fn() }]);
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens, focuses the first item and runs the selected action then closes", async () => {
    const onSelect = vi.fn();
    const { user, trigger } = setup([
      { key: "a", label: "Editar", onSelect },
      { key: "b", label: "Inactivar", onSelect: vi.fn(), tone: "danger" },
    ]);
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Editar" })).toHaveFocus();
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const { user, trigger } = setup([{ key: "a", label: "Editar", onSelect: vi.fn() }]);
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes with Escape even when focus is back on the trigger", async () => {
    const { user, trigger } = setup([{ key: "a", label: "Editar", onSelect: vi.fn() }]);
    await user.click(trigger);
    trigger.focus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders disabled items as disabled and does not run them", async () => {
    const onSelect = vi.fn();
    const { user, trigger } = setup([{ key: "a", label: "Inactivar", onSelect, disabled: true }]);
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Inactivar" })).toBeDisabled();
    await user.click(screen.getByRole("menuitem", { name: "Inactivar" }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("moves with arrows, wraps and supports Home/End", async () => {
    const { user, trigger } = setup([
      { key: "a", label: "Uno", onSelect: vi.fn() },
      { key: "b", label: "Dos", onSelect: vi.fn() },
      { key: "c", label: "Tres", onSelect: vi.fn() },
    ]);
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Dos" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Tres" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Uno" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Tres" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "Uno" })).toHaveFocus();
  });

  it("closes when clicking outside", async () => {
    const { user, trigger } = setup([{ key: "a", label: "Editar", onSelect: vi.fn() }]);
    await user.click(trigger);
    await user.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders link items as menuitems", async () => {
    const { user, trigger } = setup([{ key: "h", label: "Historial de ventas", to: "/ventas", params: {} }]);
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Historial de ventas" })).toHaveAttribute("href", "/ventas");
  });

  it("renders the menu in a fixed-position portal outside the trigger's container", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div className="admin-table-shell" style={{ overflow: "auto" }}>
        <AdminOverflowMenu label="Más acciones" items={[{ key: "a", label: "Editar", onSelect: vi.fn() }]} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    const menu = screen.getByRole("menu");
    expect(container).not.toContainElement(menu);
    expect(menu.parentElement).toBe(document.body);
    expect(menu.style.position).toBe("fixed");
  });

  it("portals into the enclosing modal dialog so it stays in the top layer", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <dialog open>
        <AdminOverflowMenu label="Más acciones" items={[{ key: "a", label: "Editar", onSelect: vi.fn() }]} />
      </dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    expect(screen.getByRole("menu").parentElement).toBe(container.querySelector("dialog"));
  });

  it("aligns to the trigger's right edge and flips upward when there is no room below", async () => {
    const user = userEvent.setup();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function rect() {
      if (this.getAttribute("role") === "menu") {
        return { top: 0, left: 0, right: 224, bottom: 200, width: 224, height: 200, x: 0, y: 0 };
      }
      return { top: 700, left: 964, right: 1000, bottom: 736, width: 36, height: 36, x: 964, y: 700 };
    });
    setup([{ key: "a", label: "Editar", onSelect: vi.fn() }]);
    await user.click(screen.getByRole("button", { name: "Más acciones de Editorial" }));
    const menu = screen.getByRole("menu");
    expect(menu.style.left).toBe("776px");
    expect(menu.style.top).toBe("496px");
  });

  it("opens below the trigger when there is room", async () => {
    const user = userEvent.setup();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function rect() {
      if (this.getAttribute("role") === "menu") {
        return { top: 0, left: 0, right: 224, bottom: 200, width: 224, height: 200, x: 0, y: 0 };
      }
      return { top: 100, left: 964, right: 1000, bottom: 136, width: 36, height: 36, x: 964, y: 100 };
    });
    setup([{ key: "a", label: "Editar", onSelect: vi.fn() }]);
    await user.click(screen.getByRole("button", { name: "Más acciones de Editorial" }));
    expect(screen.getByRole("menu").style.top).toBe("140px");
  });

  it("keeps a disabled item with a hint focusable, described by the hint and inert", async () => {
    const onSelect = vi.fn();
    const { user, trigger } = setup([
      { key: "a", label: "Editar", onSelect: vi.fn() },
      { key: "b", label: "Desactivar", onSelect, disabled: true, hint: "Quita el destacado antes" },
    ]);
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    const item = screen.getByRole("menuitem", { name: "Desactivar" });
    expect(item).toHaveFocus();
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).not.toBeDisabled();
    expect(item).toHaveAccessibleDescription("Quita el destacado antes");
    expect(within(screen.getByRole("menu")).getAllByRole("menuitem")).toHaveLength(2);
    await user.click(item);
    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
