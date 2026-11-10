import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarPicker, ChoiceCard, ChoiceGroup } from "./PublicForm";

describe("ChoiceGroup", () => {
  it("exposes a required radio group named by its label", () => {
    render(
      <ChoiceGroup label="Modalidad de participación" required>
        <ChoiceCard name="m" value="a" title="Individual" />
        <ChoiceCard name="m" value="b" title="Grupal" />
      </ChoiceGroup>,
    );

    const grupo = screen.getByRole("radiogroup", { name: /modalidad de participación/i });
    expect(grupo).toHaveAttribute("aria-required", "true");
  });

  it("marks every radio invalid and linked to the error when the group has one", () => {
    render(
      <ChoiceGroup legend="Horarios" required error="Elegí un horario" id="g">
        <ChoiceCard name="h" value="a" title="9:00" />
        <ChoiceCard name="h" value="b" title="10:00" />
      </ChoiceGroup>,
    );

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("aria-invalid", "true");
      expect(radio).toHaveAttribute("aria-describedby", "g-error");
    }
  });

  it("stays a plain group for checkboxes", () => {
    render(
      <ChoiceGroup label="Necesidades" type="checkbox">
        <ChoiceCard type="checkbox" name="n" title="Parqueo" />
      </ChoiceGroup>,
    );

    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: /necesidades/i })).toBeInTheDocument();
  });
});

describe("CalendarPicker", () => {
  it("is a labelled group that carries the invalid state", () => {
    render(
      <CalendarPicker
        id="cal"
        label="Calendario de fechas"
        selected={null}
        onSelect={() => {}}
        enabledDates={[]}
        legend="Fecha disponible"
        invalid
        describedBy="cal-error"
      />,
    );

    const grupo = screen.getByRole("group", { name: /calendario de fechas/i });
    expect(grupo).toHaveAttribute("aria-invalid", "true");
    expect(grupo).toHaveAttribute("aria-describedby", "cal-error");
    expect(grupo).toHaveAttribute("id", "cal");
  });
});
