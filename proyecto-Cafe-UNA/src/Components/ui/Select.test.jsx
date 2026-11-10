import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UiSelect } from "./Select";
import { ModalDialog } from "./ModalDialog";

function renderWithLabel() {
  render(
    <div>
      <label htmlFor="color-select">Color</label>
      <UiSelect
        id="color-select"
        value="a"
        onChange={() => {}}
        options={[
          { value: "a", label: "Rojo" },
          { value: "b", label: "Azul" },
        ]}
        traducirOpciones={false}
      />
      <button type="button">Outside</button>
    </div>,
  );
  return screen.getByRole("button", { name: "Color" });
}

describe("UiSelect open state", () => {
  it("toggles from its trigger", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on an outside click", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a closed select when its label is clicked", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(screen.getByText("Color"));

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes an open select when its label is clicked, without reopening it", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByText("Color"));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders its menu inside an enclosing modal dialog so it stays visible and clickable", async () => {
    const onChange = vi.fn();
    render(
      <ModalDialog label="Filtros">
        <UiSelect
          ariaLabel="Color"
          value="a"
          onChange={onChange}
          options={[
            { value: "a", label: "Rojo" },
            { value: "b", label: "Azul" },
          ]}
          traducirOpciones={false}
        />
      </ModalDialog>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Color", hidden: true }));

    const menu = document.querySelector(".ui-select__menu");
    expect(menu.closest("dialog")).toBe(document.querySelector("dialog"));
    fireEvent.pointerDown(screen.getByRole("option", { name: "Azul", hidden: true }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("closes only the open menu on Escape inside a dialog; a second Escape closes the dialog", async () => {
    const onClose = vi.fn();
    render(
      <ModalDialog label="Filtros" onClose={onClose}>
        <UiSelect
          ariaLabel="Color"
          value="a"
          onChange={() => {}}
          options={[
            { value: "a", label: "Rojo" },
            { value: "b", label: "Azul" },
          ]}
          traducirOpciones={false}
        />
      </ModalDialog>,
    );
    const trigger = screen.getByRole("button", { name: "Color", hidden: true });

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(screen.getByRole("option", { name: "Azul", hidden: true }), { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("UiSelect group headings", () => {
  function renderGrouped(onChange = () => {}, buscable = false) {
    render(
      <UiSelect
        id="grouped"
        ariaLabel="Categoría"
        value="a"
        onChange={onChange}
        buscable={buscable}
        traducirOpciones={false}
        options={[
          { heading: true, value: "__g1", label: "Grupo uno" },
          { value: "a", label: "Rojo" },
          { heading: true, value: "__g2", label: "Grupo dos" },
          { value: "b", label: "Azul" },
        ]}
      />,
    );
    return screen.getByRole("button", { name: "Categoría" });
  }

  it("shows headings without exposing them as options", async () => {
    await userEvent.click(renderGrouped());

    expect(screen.getByText("Grupo uno")).toBeInTheDocument();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Rojo", "Azul"]);
  });

  it("does not select a heading when it is clicked", async () => {
    const onChange = vi.fn();
    await userEvent.click(renderGrouped(onChange));

    await userEvent.click(screen.getByText("Grupo dos"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("skips headings when Enter is pressed in the search box", async () => {
    const onChange = vi.fn();
    await userEvent.click(renderGrouped(onChange, true));

    await userEvent.type(screen.getByRole("searchbox"), "{Enter}");

    expect(onChange).toHaveBeenCalledWith("a");
  });
});
