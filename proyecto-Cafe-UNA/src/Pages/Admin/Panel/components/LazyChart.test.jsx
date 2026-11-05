import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LazyChart } from "./LazyChart";

function Chart({ titulo }) {
  return <p>{titulo}</p>;
}

describe("LazyChart", () => {
  it("shows a card error and leaves siblings rendered when the chunk fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const load = vi.fn().mockRejectedValue(new Error("chunk failed"));
    render(
      <div>
        <p>Resto del panel</p>
        <LazyChart load={load} fallback={<div>cargando</div>} titulo="Ingresos" />
      </div>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el gráfico.");
    expect(screen.getByText("Resto del panel")).toBeInTheDocument();
  });

  it("retry requests the chunk again and renders the chart", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValue({ default: Chart });
    render(<LazyChart load={load} fallback={<div>cargando</div>} titulo="Ingresos" />);

    await user.click(await screen.findByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Ingresos")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
