import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminSalidasInventario from "./SalidasInventario";

const mocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
  obtenerProductos: vi.fn(),
  limpiarProductosCache: vi.fn(),
  obtenerStockPorUbicacion: vi.fn(),
  limpiarInventarioUbicacionCache: vi.fn(),
  obtenerMotivosSalida: vi.fn(),
  registrarSalidaInventario: vi.fn(),
  crearSolicitudSalidaInventario: vi.fn(),
  obtenerSolicitudesSalidaInventario: vi.fn(),
  revisarSolicitudSalidaInventario: vi.fn(),
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
vi.mock("../../../Components/ui/SelectFiltro", () => ({
  SelectFiltro: ({ children, ...props }) => {
    delete props.traducirOpciones;
    return <select {...props}>{children}</select>;
  },
}));
vi.mock("./SalidaInventarioForm", () => ({
  SalidaInventarioForm: ({ onSubmit, productos }) => (
    <>
      <output data-testid="stock-products">{JSON.stringify(productos.map((product) => product.centralStock))}</output>
      <button type="button" onClick={() => onSubmit({ productoId: "101", cantidad: 3, motivoSalidaId: 1 })}>
        Registrar salida
      </button>
    </>
  ),
}));
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: mocks.getActiveSessionUser,
}));
vi.mock("../../../services/productosService", () => ({
  obtenerProductos: mocks.obtenerProductos,
  limpiarProductosCache: mocks.limpiarProductosCache,
  obtenerStockPorUbicacion: mocks.obtenerStockPorUbicacion,
  limpiarInventarioUbicacionCache: mocks.limpiarInventarioUbicacionCache,
}));
vi.mock("../../../services/inventarioSalidasService", () => ({
  obtenerMotivosSalida: mocks.obtenerMotivosSalida,
  registrarSalidaInventario: mocks.registrarSalidaInventario,
  crearSolicitudSalidaInventario: mocks.crearSolicitudSalidaInventario,
  obtenerSolicitudesSalidaInventario: mocks.obtenerSolicitudesSalidaInventario,
  revisarSolicitudSalidaInventario: mocks.revisarSolicitudSalidaInventario,
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
    mocks.obtenerStockPorUbicacion.mockResolvedValue([{
      productId: "101",
      locationCode: "BODEGA_CENTRAL",
      stock: 8,
      reservedStock: 5,
      availableStock: 3,
      provisioned: true,
    }]);
    mocks.obtenerMotivosSalida.mockResolvedValue(motivos);
    mocks.registrarSalidaInventario.mockResolvedValue({ id: 9001 });
    mocks.crearSolicitudSalidaInventario.mockResolvedValue({ id: 9002, estado: "pendiente" });
    mocks.obtenerSolicitudesSalidaInventario.mockResolvedValue([]);
    mocks.revisarSolicitudSalidaInventario.mockResolvedValue({ id: 9002, estado: "aprobada" });
  });

  it("loads inventory and sends the authorized warehouse-exit request", async () => {
    const user = userEvent.setup();
    render(<AdminSalidasInventario />);

    await user.click(await screen.findByRole("button", { name: "Registrar salida" }));

    await waitFor(() => expect(mocks.registrarSalidaInventario).toHaveBeenCalledWith({
      productoId: "101",
      cantidad: 3,
      motivoSalidaId: 1,
    }));
    expect(mocks.obtenerProductos).toHaveBeenCalledTimes(2);
    expect(mocks.obtenerStockPorUbicacion).toHaveBeenCalledWith("BODEGA_CENTRAL");
    expect(mocks.obtenerStockPorUbicacion).toHaveBeenCalledTimes(2);
    expect(mocks.obtenerMotivosSalida).toHaveBeenCalledTimes(2);
    expect(mocks.limpiarProductosCache).toHaveBeenCalledOnce();
    expect(mocks.limpiarInventarioUbicacionCache).toHaveBeenCalledOnce();
    expect(await screen.findByText("La salida de inventario se registró correctamente.")).toBeInTheDocument();
  });

  it("provides reservation-net central stock to both inventory forms", async () => {
    render(<AdminSalidasInventario />);

    expect(await screen.findByTestId("stock-products")).toHaveTextContent('"available":3');
    expect(mocks.obtenerStockPorUbicacion).toHaveBeenCalledWith("BODEGA_CENTRAL");
  });

  it("does not load or submit inventory for a user without the required permission", async () => {
    mocks.getActiveSessionUser.mockReturnValue({ roles: ["Cliente"] });
    render(<AdminSalidasInventario />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No tenés permiso");
    expect(mocks.obtenerProductos).not.toHaveBeenCalled();
    expect(mocks.obtenerMotivosSalida).not.toHaveBeenCalled();
  });

  it("shows review actions to the Superadministrador role alias", async () => {
    mocks.getActiveSessionUser.mockReturnValue({ roles: ["Superadministrador"] });
    mocks.obtenerSolicitudesSalidaInventario.mockResolvedValue([{
      Id: "55",
      Estado: "pendiente",
      Tipo: "donacion",
      Destinatario: "Fundación Café UNA",
      ResponsableNombre: "Ana Solís",
      FechaSalida: "2026-10-27",
      Items: [],
      Historial: [],
    }]);
    render(<AdminSalidasInventario />);

    expect(await screen.findByRole("button", { name: "Aprobar" })).toBeInTheDocument();
  });
});
