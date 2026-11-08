import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPuntosVenta from "./PuntosVenta";

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
    expect(screen.getByText("POS_EDITORIAL · Activo · 2 productos · 118 unidades")).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Editar stock de Café en grano" }).length).toBeGreaterThan(0);
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
