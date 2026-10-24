import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDiasSinRetiro from "./DiasSinRetiro";

const mocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
  listarCierresCompraAdmin: vi.fn(),
  guardarCierreCompra: vi.fn(),
  eliminarCierreCompra: vi.fn(),
  obtenerUbicaciones: vi.fn(),
}));

vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ allowed = true, children }) => (allowed ? children : <p role="alert">Sin permiso</p>),
}));
vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: mocks.getActiveSessionUser,
}));
vi.mock("../../../services/ajustesService", () => ({
  listarCierresCompraAdmin: mocks.listarCierresCompraAdmin,
  guardarCierreCompra: mocks.guardarCierreCompra,
  eliminarCierreCompra: mocks.eliminarCierreCompra,
}));
vi.mock("../../../services/productosService", () => ({
  obtenerUbicaciones: mocks.obtenerUbicaciones,
}));

describe("AdminDiasSinRetiro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActiveSessionUser.mockReturnValue({ roles: ["Admin"] });
    mocks.listarCierresCompraAdmin.mockResolvedValue([]);
    mocks.obtenerUbicaciones.mockResolvedValue([
      { id: 2, code: "POS_HEREDIA", name: "Heredia", activo: true },
      { id: 9, code: "BODEGA", name: "Bodega Central", activo: true },
    ]);
    mocks.guardarCierreCompra.mockResolvedValue({ id: 3, fecha: "2099-04-15", nota: "Feriado", ubicacionId: null });
  });

  it("muestra el editor vacío cuando no hay fechas", async () => {
    render(<AdminDiasSinRetiro />);

    expect(await screen.findByRole("heading", { name: "Días sin retiro" })).toBeTruthy();
    expect(screen.getByText("No hay fechas registradas.")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Heredia" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Bodega Central" })).toBeNull();
  });

  it("guarda un cierre general de compras", async () => {
    const user = userEvent.setup();
    render(<AdminDiasSinRetiro />);
    await screen.findByText("No hay fechas registradas.");

    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2099-04-15" } });
    await user.type(screen.getByLabelText("Motivo"), "Feriado nacional");
    await user.click(screen.getByRole("button", { name: "Agregar fecha" }));

    await waitFor(() => expect(mocks.guardarCierreCompra).toHaveBeenCalledWith({
      fecha: "2099-04-15",
      nota: "Feriado nacional",
      ubicacionId: null,
    }));
  });
});
