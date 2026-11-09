import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleLocationSelector } from "./PointOfSaleLocationSelector";
import { LOCATION_PILLS_MAX } from "./locationSelectorConfig";

const make = (n) =>
  Array.from({ length: n }, (_, index) => ({
    code: `POS_${index + 1}`,
    name: index === 0 ? "Editorial" : `Punto ${index + 1}`,
    activo: index !== 1,
  }));

describe("PointOfSaleLocationSelector with few locations", () => {
  it("renders a tablist with one tab per location and status in the accessible name", () => {
    render(<PointOfSaleLocationSelector locations={make(3)} selectedCode="POS_1" onSelect={vi.fn()} panelId="panel" />);
    const tablist = screen.getByRole("tablist");
    expect(within(tablist).getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Editorial, activo" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Punto 2, inactivo" })).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("uses roving tabindex and controls the panel", () => {
    render(<PointOfSaleLocationSelector locations={make(3)} selectedCode="POS_1" onSelect={vi.fn()} panelId="panel" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    expect(tabs[0]).toHaveAttribute("aria-controls", "panel");
  });

  it("selects with click and navigates with Arrow, Home and End keys", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PointOfSaleLocationSelector locations={make(3)} selectedCode="POS_1" onSelect={onSelect} panelId="panel" />);
    await user.click(screen.getByRole("tab", { name: "Punto 3, activo" }));
    expect(onSelect).toHaveBeenLastCalledWith("POS_3");
    screen.getByRole("tab", { name: "Editorial, activo" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onSelect).toHaveBeenLastCalledWith("POS_2");
    await user.keyboard("{ArrowLeft}");
    expect(onSelect).toHaveBeenLastCalledWith("POS_1");
    await user.keyboard("{ArrowLeft}");
    expect(onSelect).toHaveBeenLastCalledWith("POS_3");
    await user.keyboard("{Home}");
    expect(onSelect).toHaveBeenLastCalledWith("POS_1");
    await user.keyboard("{End}");
    expect(onSelect).toHaveBeenLastCalledWith("POS_3");
  });

  it("keeps pills up to the threshold", () => {
    render(<PointOfSaleLocationSelector locations={make(LOCATION_PILLS_MAX)} selectedCode="POS_1" onSelect={vi.fn()} panelId="panel" />);
    expect(screen.getAllByRole("tab")).toHaveLength(LOCATION_PILLS_MAX);
  });
});

describe("PointOfSaleLocationSelector with many locations", () => {
  const many = make(LOCATION_PILLS_MAX + 2);

  it("switches to a combobox trigger showing the current location", () => {
    render(<PointOfSaleLocationSelector locations={many} selectedCode="POS_1" onSelect={vi.fn()} panelId="panel" />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: /Punto de venta: Editorial/i });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a searchable listbox, filters, and selects with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PointOfSaleLocationSelector locations={many} selectedCode="POS_1" onSelect={onSelect} panelId="panel" />);
    await user.click(screen.getByRole("button", { name: /Punto de venta: Editorial/i }));
    const search = screen.getByRole("combobox", { name: /Buscar punto de venta/i });
    expect(search).toHaveFocus();
    expect(screen.getAllByRole("option")).toHaveLength(many.length);

    await user.type(search, "punto 5");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveAccessibleName("Punto 5, activo");
    expect(search).toHaveAttribute("aria-activedescendant", options[0].id);
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("POS_5");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("matches ignoring accents and by code, and shows an empty message", async () => {
    const user = userEvent.setup();
    const locations = [...many.slice(0, 7), { code: "POS_CAFE", name: "Café Central", activo: true }];
    render(<PointOfSaleLocationSelector locations={locations} selectedCode="POS_1" onSelect={vi.fn()} panelId="panel" />);
    await user.click(screen.getByRole("button", { name: /Punto de venta/i }));
    const search = screen.getByRole("combobox");
    await user.type(search, "cafe");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.clear(search);
    await user.type(search, "zzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("moves the active option with arrows and closes on Escape returning focus", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PointOfSaleLocationSelector locations={many} selectedCode="POS_1" onSelect={onSelect} panelId="panel" />);
    const trigger = screen.getByRole("button", { name: /Punto de venta/i });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("POS_2");

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
