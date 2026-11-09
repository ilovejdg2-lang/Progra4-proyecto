import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPuntosVenta from "./PuntosVenta";
import { actualizarUbicacion, obtenerUbicaciones } from "../../../services/productosService";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, to, role }) => <a className={className} href={to} role={role}>{children}</a>,
}));
vi.mock("../layouts/AdminLayout", () => ({ AdminLayout: ({ children }) => <div>{children}</div> }));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({ AdminPageGate: ({ children }) => <div>{children}</div> }));
vi.mock("../../../hooks/useAdminPageGate", () => ({ useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }) }));
vi.mock("../../../hooks/useProductCatalog", () => ({
  useProductCatalog: () => ({ data: [], status: "success", loading: false, error: null, retry: vi.fn() }),
}));
vi.mock("../../../hooks/useLocationStock", () => ({
  useLocationStock: () => ({ data: [], status: "success", loading: false, error: null, retry: vi.fn() }),
}));
vi.mock("../../../services/sessionService", () => ({ getActiveSessionUser: () => ({ id: 1 }) }));
vi.mock("../../../lib/permisos", () => ({
  rolesDeUsuario: () => ["admin"],
  tienePermiso: () => true,
}));
vi.mock("../../../services/productosService", () => ({
  obtenerUbicaciones: vi.fn(),
  actualizarUbicacion: vi.fn(),
  ajustarStockPorUbicacion: vi.fn(),
  crearUbicacion: vi.fn(),
}));

describe("AdminPuntosVenta refetch", () => {
  beforeEach(() => {
    vi.mocked(obtenerUbicaciones).mockReset();
    vi.mocked(actualizarUbicacion).mockReset();
  });

  it("keeps the panel mounted and focus off the body while refetching after inactivating", async () => {
    vi.mocked(obtenerUbicaciones).mockResolvedValueOnce([{ code: "POS_EDITORIAL", name: "Editorial", activo: true }]);
    vi.mocked(actualizarUbicacion).mockResolvedValue({ code: "POS_EDITORIAL", name: "Editorial", activo: false });
    let resolveRefetch;
    vi.mocked(obtenerUbicaciones).mockReturnValueOnce(new Promise((resolve) => { resolveRefetch = resolve; }));

    const user = userEvent.setup();
    render(<AdminPuntosVenta />);
    await screen.findByRole("heading", { level: 2, name: "Editorial" });

    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    await user.click(screen.getByRole("menuitem", { name: "Inactivar" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Inactivar" }));

    await waitFor(() => expect(obtenerUbicaciones).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("heading", { level: 2, name: "Editorial" })).toBeInTheDocument();
    expect(screen.queryByText(/Cargando puntos de venta/i)).not.toBeInTheDocument();

    resolveRefetch([{ code: "POS_EDITORIAL", name: "Editorial", activo: false }]);
    expect(await screen.findByText("Este punto está inactivo")).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    expect(screen.getByRole("button", { name: /Más acciones/i })).toBeInTheDocument();
  });
});
