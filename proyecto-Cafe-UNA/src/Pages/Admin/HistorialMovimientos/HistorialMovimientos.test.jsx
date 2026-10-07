import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";

const serviceMocks = vi.hoisted(() => ({
  obtenerHistorialMovimientos: vi.fn(),
  obtenerUbicaciones: vi.fn(),
}));

vi.mock("../../../services/movimientosService", () => serviceMocks);
vi.mock("../../../services/productosService", () => ({
  obtenerUbicaciones: serviceMocks.obtenerUbicaciones,
}));
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ id: 1, name: "Admin", roles: ["SuperAdmin"] }),
}));
vi.mock("../../../lib/permisos", () => ({
  rolesDeUsuario: () => ["SuperAdmin"],
  tienePermiso: () => true,
}));
vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ children }) => <>{children}</>,
}));
vi.mock("../../../Components/Admin/ui/AdminListaToolbar", () => ({
  AdminListaToolbar: () => null,
  AdminListaVacia: () => <div>No hay movimientos</div>,
}));
vi.mock("../../../Components/Admin/ui/AdminPaginacion", () => ({
  AdminPaginacion: () => null,
}));
vi.mock("../../../lib/useIdioma", () => ({ useIdioma: () => ({ idioma: "es" }) }));
vi.mock("../../../Components/T/ST", () => ({ ST: ({ children }) => <>{children}</> }));

import AdminHistorialMovimientos from "./HistorialMovimientos";

describe("AdminHistorialMovimientos", () => {
  beforeEach(() => {
    serviceMocks.obtenerUbicaciones.mockResolvedValue([]);
    serviceMocks.obtenerHistorialMovimientos.mockResolvedValue({
      total: 2,
      items: [
        {
          id: "donation-1",
          tipo: "salida_bodega",
          productoNombre: "Café",
          cantidad: 1,
          destinoNombre: "",
          destinatario: "Punto 1",
        },
        {
          id: "sale-1",
          tipo: "venta_web",
          productoNombre: "Café",
          cantidad: 1,
          destinoNombre: "Cliente",
          destinatario: null,
        },
      ],
    });
  });

  it("shows the recipient separately from physical destination and keeps empty values stable", async () => {
    render(<AdminHistorialMovimientos />);

    const table = await screen.findByRole("table");
    const headers = within(table).getAllByRole("columnheader").map((cell) => cell.textContent);
    expect(headers).toContain("Destino");
    expect(headers).toContain("Destinatario");

    await waitFor(() => expect(within(table).getByText("Punto 1")).toBeInTheDocument());
    const donationRow = within(table).getByText("Punto 1").closest("tr");
    const donationCells = within(donationRow).getAllByRole("cell");
    expect(donationCells[5]).toHaveTextContent("—");
    expect(donationCells[6]).toHaveTextContent("Punto 1");

    const saleRow = within(table).getByText("Cliente").closest("tr");
    const saleCells = within(saleRow).getAllByRole("cell");
    expect(saleCells[5]).toHaveTextContent("Cliente");
    expect(saleCells[6]).toHaveTextContent("—");
  });
});
