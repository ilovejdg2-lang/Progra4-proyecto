import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminSalidasInventario from "./SalidasInventario";

const mocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
  obtenerProductos: vi.fn(),
  limpiarProductosCache: vi.fn(),
  obtenerMotivosSalida: vi.fn(),
  registrarSalidaInventario: vi.fn(),
}));

vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ allowed = true, children }) => allowed
    ? children
    : <p role="alert">No tenés permiso para registrar salidas.</p>,
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
vi.mock("../../../services/productosService", () => ({
  obtenerProductos: mocks.obtenerProductos,
  limpiarProductosCache: mocks.limpiarProductosCache,
}));
vi.mock("../../../services/inventarioSalidasService", () => ({
  obtenerMotivosSalida: mocks.obtenerMotivosSalida,
  registrarSalidaInventario: mocks.registrarSalidaInventario,
}));

const productos = [
  { id: "101", nombre: "Café de altura", stock: 8, estado: "Habilitado" },
];
const motivos = [
  { id: 1, nombre: "Venta" },
  { id: 2, nombre: "Donación" },
  { id: 3, nombre: "Traslado" },
  { id: 4, nombre: "Ajuste por merma" },
];

describe("AdminSalidasInventario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActiveSessionUser.mockReturnValue({ roles: ["Vendedor"] });
    mocks.obtenerProductos.mockResolvedValue(productos);
    mocks.obtenerMotivosSalida.mockResolvedValue(motivos);
    mocks.registrarSalidaInventario.mockResolvedValue({ id: 9001 });
  });

  it("loads inventory and sends the authorized warehouse-exit request", async () => {
    const user = userEvent.setup();
    render(<AdminSalidasInventario />);

    await user.selectOptions(await screen.findByRole("combobox", { name: "Producto" }), "101");
    await user.selectOptions(screen.getByRole("combobox", { name: "Motivo de salida" }), "2");
    await user.type(screen.getByRole("textbox", { name: "Destinatario" }), "Fundación Café UNA");
    await user.type(screen.getByRole("textbox", { name: "Cantidad" }), "3");
    await user.click(screen.getByRole("button", { name: "Registrar salida" }));

    await waitFor(() => expect(mocks.registrarSalidaInventario).toHaveBeenCalledWith({
      productoId: "101",
      cantidad: 3,
      motivoSalidaId: 2,
      destinatario: "Fundación Café UNA",
    }));
    expect(mocks.obtenerProductos).toHaveBeenCalledOnce();
    expect(mocks.obtenerMotivosSalida).toHaveBeenCalledOnce();
    expect(mocks.limpiarProductosCache).toHaveBeenCalledOnce();
    expect(await screen.findByText("La salida de inventario se registró correctamente.")).toBeInTheDocument();
  });

  it("does not load or submit inventory for a user without the required permission", async () => {
    mocks.getActiveSessionUser.mockReturnValue({ roles: ["Cliente"] });
    render(<AdminSalidasInventario />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No tenés permiso");
    expect(mocks.obtenerProductos).not.toHaveBeenCalled();
    expect(mocks.obtenerMotivosSalida).not.toHaveBeenCalled();
  });
});
