import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
});
