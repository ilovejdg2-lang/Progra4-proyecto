import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HorarioCompra } from "./HorarioCompra";

const mocks = vi.hoisted(() => ({
  listarCierresCompra: vi.fn(),
}));

vi.mock("../../services/ajustesService", () => ({
  listarCierresCompra: mocks.listarCierresCompra,
}));

describe("HorarioCompra", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no muestra el apartado cuando no hay fechas registradas", async () => {
    mocks.listarCierresCompra.mockResolvedValue([]);
    const { container } = render(
      <HorarioCompra ubicacionId={4} variante="incrustada" />,
    );

    await waitFor(() => expect(mocks.listarCierresCompra).toHaveBeenCalledWith(4));
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Fechas sin retiro de pedidos")).toBeNull();
  });

  it("muestra la fecha y el motivo del cierre que aplica al punto", async () => {
    mocks.listarCierresCompra.mockResolvedValue([
      { id: 8, fecha: "2099-04-15", nota: "Feriado nacional", ubicacionId: null },
    ]);
    render(<HorarioCompra ubicacionId={4} variante="incrustada" />);

    expect(await screen.findByText("Fechas sin retiro de pedidos")).toBeTruthy();
    expect(screen.getByText("Feriado nacional")).toBeTruthy();
    expect(screen.getByText(/15 de abril/i)).toBeTruthy();
  });
});
