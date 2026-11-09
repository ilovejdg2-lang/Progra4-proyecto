import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPuntosVenta from "./PuntosVenta";
import { actualizarUbicacion, ajustarStockPorUbicacion } from "../../../services/productosService";

const mocks = vi.hoisted(() => ({
  locations: { data: [], status: "success", loading: false, error: null, retry: vi.fn() },
  catalog: { data: [], status: "success", loading: false, error: null, retry: vi.fn() },
  stock: { data: [], status: "success", loading: false, error: null, retry: vi.fn() },
  permisos: new Set(["ver_inventario", "ajustar_stock_ubicaciones"]),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, to, role }) => <a className={className} href={to} role={role}>{children}</a>,
}));
vi.mock("../layouts/AdminLayout", () => ({ AdminLayout: ({ children }) => <div>{children}</div> }));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({ AdminPageGate: ({ children }) => <div>{children}</div> }));
vi.mock("../../../hooks/useAdminPageGate", () => ({ useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }) }));
vi.mock("../../../hooks/useInventoryLocations", () => ({ useInventoryLocations: () => mocks.locations }));
vi.mock("../../../hooks/useProductCatalog", () => ({ useProductCatalog: () => mocks.catalog }));
vi.mock("../../../hooks/useLocationStock", () => ({ useLocationStock: () => mocks.stock }));
vi.mock("../../../services/sessionService", () => ({ getActiveSessionUser: () => ({ id: 1 }) }));
vi.mock("../../../lib/permisos", () => ({
  rolesDeUsuario: () => ["admin"],
  tienePermiso: (_roles, permiso) => mocks.permisos.has(permiso),
}));
vi.mock("../../../services/productosService", () => ({
  actualizarUbicacion: vi.fn(),
  ajustarStockPorUbicacion: vi.fn(),
  crearUbicacion: vi.fn(),
}));

const loc = (code, name, activo = true) => ({ code, name, activo });
const product = (id, nombre, extra = {}) => ({ id, nombre, descripcion: "", estado: "Habilitado", peso: "500 g", categoria: "Café", imagen: "", ...extra });

beforeEach(() => {
  mocks.permisos = new Set(["ver_inventario", "ajustar_stock_ubicaciones"]);
  mocks.locations = { data: [], status: "success", loading: false, error: null, retry: vi.fn() };
  mocks.catalog = { data: [], status: "success", loading: false, error: null, retry: vi.fn() };
  mocks.stock = { data: [], status: "success", loading: false, error: null, retry: vi.fn() };
  vi.mocked(actualizarUbicacion).mockReset();
  vi.mocked(ajustarStockPorUbicacion).mockReset();
});

describe("AdminPuntosVenta redesign", () => {
  it("shows an empty state hosting the single primary action when there are no locations", () => {
    render(<AdminPuntosVenta />);
    expect(screen.getByText(/Todavía no hay puntos de venta/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Agregar punto de venta/i })).toHaveLength(1);
  });

  it("renders one panel: selector, selected-location header with computed meta and the table", () => {
    mocks.locations.data = [loc("POS_EDITORIAL", "Editorial"), loc("POS_FUNA_UNA", "FUNDA-UNA")];
    mocks.catalog.data = [product("1", "Café en grano"), product("2", "Café molido")];
    mocks.stock.data = [
      { productId: "1", stock: 24 },
      { productId: "2", stock: 94 },
    ];
    render(<AdminPuntosVenta />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 2, name: "Editorial" })).toBeInTheDocument();
    expect(screen.getByText("POS_EDITORIAL · Activo · 2 productos en stock · 118 unidades")).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Editar stock de Café en grano" }).length).toBeGreaterThan(0);
  });

  it("counts only in-catalog records with stock above zero in the meta line", () => {
    mocks.locations.data = [loc("POS_EDITORIAL", "Editorial")];
    mocks.catalog.data = [product("1", "Café en grano"), product("2", "Café molido")];
    mocks.stock.data = [
      { productId: "1", stock: 24 },
      { productId: "2", stock: 0 },
      { productId: "99", stock: 10 },
    ];
    render(<AdminPuntosVenta />);
    expect(screen.getByText("POS_EDITORIAL · Activo · 1 producto en stock · 24 unidades")).toBeInTheDocument();
  });

  it("uses the combobox selector when there are many locations", () => {
    mocks.locations.data = Array.from({ length: 8 }, (_, index) => loc(`POS_${index}`, `Punto ${index}`));
    render(<AdminPuntosVenta />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Punto de venta: Punto 0/i })).toBeInTheDocument();
  });

  it("explains an empty catalog for the selected location", () => {
    mocks.locations.data = [loc("POS_EDITORIAL", "Editorial")];
    render(<AdminPuntosVenta />);
    expect(screen.getByText(/todavía no hay productos/i)).toBeInTheDocument();
  });

  it("shows a muted inactive banner instead of the table for inactive locations", async () => {
    mocks.locations.data = [loc("POS_FERIAS", "Stand Ferias", false)];
    mocks.catalog.data = [product("1", "Café en grano")];
    const user = userEvent.setup();
    render(<AdminPuntosVenta />);
    expect(screen.getByText("Este punto está inactivo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar stock/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    expect(within(screen.getByRole("menu")).getByRole("menuitem", { name: "Activar" })).toBeInTheDocument();
  });

  it("hides management actions without the adjust permission", () => {
    mocks.permisos = new Set(["ver_inventario"]);
    mocks.locations.data = [loc("POS_EDITORIAL", "Editorial")];
    mocks.catalog.data = [product("1", "Café en grano")];
    render(<AdminPuntosVenta />);
    expect(screen.queryByRole("button", { name: /Agregar punto de venta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Más acciones/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar stock/i })).not.toBeInTheDocument();
  });
});

describe("AdminPuntosVenta interactions", () => {
  const twoLocations = () => {
    mocks.locations.data = [loc("POS_EDITORIAL", "Editorial"), loc("POS_FUNA_UNA", "FUNDA-UNA")];
    mocks.catalog.data = [product("1", "Café en grano")];
    mocks.stock.data = [{ productId: "1", stock: 5 }];
  };

  it("resets the selected product and messages when another location is selected", async () => {
    twoLocations();
    const user = userEvent.setup();
    render(<AdminPuntosVenta />);
    await user.click(screen.getAllByRole("button", { name: "Editar stock de Café en grano" })[0]);
    expect(screen.getByRole("dialog", { name: "Editar stock del punto" })).toBeInTheDocument();

    // The modal is inert for pointer events in the app; select through the tab programmatically.
    screen.getAllByRole("tab", { hidden: true })[1].click();
    expect(await screen.findByRole("heading", { level: 2, name: "FUNDA-UNA" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("inactivates only after confirming and does nothing on cancel", async () => {
    twoLocations();
    mocks.locations.retry = vi.fn().mockResolvedValue(undefined);
    vi.mocked(actualizarUbicacion).mockResolvedValue({ code: "POS_EDITORIAL", name: "Editorial", activo: false });
    const user = userEvent.setup();
    render(<AdminPuntosVenta />);

    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    await user.click(screen.getByRole("menuitem", { name: "Inactivar" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    expect(actualizarUbicacion).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    await user.click(screen.getByRole("menuitem", { name: "Inactivar" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Inactivar" }));
    expect(actualizarUbicacion).toHaveBeenCalledWith("POS_EDITORIAL", { activo: false });
    expect(mocks.locations.retry).toHaveBeenCalled();
    expect(await screen.findByText("Editorial quedó inhabilitado.")).toBeInTheDocument();
  });

  it("saves a stock adjustment and announces the success", async () => {
    twoLocations();
    mocks.stock.retry = vi.fn().mockResolvedValue(undefined);
    vi.mocked(ajustarStockPorUbicacion).mockResolvedValue({});
    const user = userEvent.setup();
    render(<AdminPuntosVenta />);
    await user.click(screen.getAllByRole("button", { name: "Editar stock de Café en grano" })[0]);
    const stockInput = screen.getByRole("textbox", { name: /Unidades disponibles/i });
    await user.clear(stockInput);
    await user.type(stockInput, "9");
    await user.click(screen.getByRole("textbox", { name: /Motivo del ajuste/i }));
    await user.paste("Conteo");
    await user.click(screen.getByRole("button", { name: /Guardar stock/i }));

    expect(ajustarStockPorUbicacion).toHaveBeenCalledWith("POS_EDITORIAL", "1", 9, "Conteo");
    expect(mocks.stock.retry).toHaveBeenCalled();
    expect(await screen.findByText("Stock de Café en grano actualizado en Editorial.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the error and keeps the editor open when the adjustment fails", async () => {
    twoLocations();
    vi.mocked(ajustarStockPorUbicacion).mockRejectedValue(new Error("Sin conexión"));
    const user = userEvent.setup();
    render(<AdminPuntosVenta />);
    await user.click(screen.getAllByRole("button", { name: "Editar stock de Café en grano" })[0]);
    await user.click(screen.getByRole("textbox", { name: /Motivo del ajuste/i }));
    await user.paste("Conteo");
    await user.click(screen.getByRole("button", { name: /Guardar stock/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("offers a retry when the locations fail to load", async () => {
    mocks.locations = { data: [], status: "error", loading: false, error: new Error("Falló la carga"), retry: vi.fn() };
    const user = userEvent.setup();
    render(<AdminPuntosVenta />);
    expect(screen.getByText("Falló la carga")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(mocks.locations.retry).toHaveBeenCalledTimes(1);
  });
});
