import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectApprovedModalAnatomy } from "../../../test/modalAnatomy";
import AdminDistribucion from "./Distribucion";

const mocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
  obtenerCatalogoProductos: vi.fn(),
  obtenerStockPorUbicacion: vi.fn(),
  obtenerHistorialTransferencias: vi.fn(),
}));

vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ children }) => children,
}));
vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("../../../hooks/useInventoryLocations", () => ({
  useInventoryLocations: () => ({ data: [], loading: false }),
}));
vi.mock("../../../lib/permisos", () => ({
  rolesDeUsuario: () => ["admin"],
  tienePermiso: () => true,
}));
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: mocks.getActiveSessionUser,
}));
vi.mock("../../../services/productosService", () => ({
  limpiarInventarioUbicacionCache: vi.fn(),
  obtenerCatalogoProductos: mocks.obtenerCatalogoProductos,
  obtenerStockPorUbicacion: mocks.obtenerStockPorUbicacion,
}));
vi.mock("../../../services/transferenciasService", () => ({
  crearTransferencia: vi.fn(),
  obtenerHistorialTransferencias: mocks.obtenerHistorialTransferencias,
}));

describe("AdminDistribucion creation modal", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    mocks.getActiveSessionUser.mockReturnValue({ id: 1 });
    mocks.obtenerCatalogoProductos.mockResolvedValue([]);
    mocks.obtenerStockPorUbicacion.mockResolvedValue([]);
    mocks.obtenerHistorialTransferencias.mockResolvedValue({ items: [], total: 0 });
  });

  it("has a header close, a Cancelar and a coffee primary", async () => {
    const user = userEvent.setup();
    render(<AdminDistribucion />);

    await user.click(await screen.findByRole("button", { name: /Nueva distribución/i }));
    const dialog = await screen.findByRole("dialog", { name: "Nueva distribución" });
    // Closing is internal state: the helper clicks the header X, then we assert the dialog is gone.
    await expectApprovedModalAnatomy(dialog, {
      primaryName: "Confirmar distribución",
      afterClose: () => waitFor(() => expect(screen.queryByRole("dialog", { name: "Nueva distribución" })).toBeNull()),
    });
  });
});
