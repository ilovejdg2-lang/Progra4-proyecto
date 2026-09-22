import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
  navigate: vi.fn(),
  obtenerCompraPorId: vi.fn(),
  obtenerMisCompras: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }) => <a>{children}</a>,
  useNavigate: () => mocks.navigate,
}));
vi.mock("lucide-react", () => ({ ArrowLeft: () => null, Eye: () => null, X: () => null }));
vi.mock("../../Components/Admin/ui/AdminModal", () => ({
  AdminModal: ({ children }) => <div>{children}</div>,
  AdminModalBody: ({ children }) => <div>{children}</div>,
  AdminModalHeader: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../Components/NumericInput/NumericInput", () => ({
  NumericInput: ({ decimal: _decimal, ...props }) => <input {...props} />,
}));
vi.mock("../../Components/PublicPageGate/PublicPageGate", () => ({ PublicPageGate: ({ children }) => children }));
vi.mock("../../Components/T/ST", () => ({ ST: ({ children }) => children }));
vi.mock("../../hooks/usePublicPageLoadingGate", () => ({ usePublicPageLoadingGate: () => false }));
vi.mock("../../hooks/useTraducir", () => ({ useTraducir: (text) => text }));
vi.mock("../../lib/permisos", () => ({ rolesDeUsuario: () => ["Cliente"], tienePermiso: () => true }));
vi.mock("../../lib/t", () => ({ t: (text) => text }));
vi.mock("../../services/comprasService", () => ({
  obtenerCompraPorId: (...args) => mocks.obtenerCompraPorId(...args),
  obtenerMisCompras: (...args) => mocks.obtenerMisCompras(...args),
}));
vi.mock("../../services/informacionService", () => ({
  obtenerFooter: vi.fn().mockResolvedValue({ correo: "contacto@cafeuna.cr", telefono: "2277-0000" }),
}));
vi.mock("../../services/sessionService", () => ({
  SESSION_UPDATED_EVENT: "session-updated",
  getActiveSessionUser: (...args) => mocks.getActiveSessionUser(...args),
}));

import HistorialComprasCliente, { HistorialComprasContent } from "./HistorialComprasCliente";

const compra = {
  id: "10",
  numero: "C-10",
  fecha: "2026-09-14T15:38:00.000Z",
  cantidadProductos: 1,
  total: 5650,
  estado: "Pendiente",
};

describe("HistorialComprasContent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.getActiveSessionUser.mockReset();
    mocks.navigate.mockReset();
    mocks.obtenerCompraPorId.mockReset();
    mocks.obtenerMisCompras.mockReset();
    mocks.getActiveSessionUser.mockImplementation(() => ({ id: "cliente-1", token: "jwt" }));
    mocks.obtenerMisCompras.mockResolvedValue({ data: [compra], totalPages: 1 });
  });

  it("loads the purchase history once after state updates", async () => {
    render(<HistorialComprasContent />);

    expect(await screen.findByText("C-10")).toBeInTheDocument();
    expect(screen.getAllByText("Procesando").length).toBeGreaterThanOrEqual(1);
    await waitFor(() => expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1));
    expect(mocks.obtenerMisCompras).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
  });

  it("opens the selected purchase detail", async () => {
    mocks.obtenerCompraPorId.mockResolvedValue({
      ...compra,
      metodoPago: "Comprobante",
      subtotal: 5000,
      impuestos: 650,
      ubicacionNombre: "FUNDA-UNA",
      items: [{ nombre: "Café de prueba", cantidad: 1, precioUnitario: 5650, subtotal: 5650 }],
    });
    render(<HistorialComprasContent />);

    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/i }));

    expect(await screen.findByText("FUNDA-UNA")).toBeInTheDocument();
    expect(screen.getByText("Café de prueba")).toBeInTheDocument();
    expect(screen.getByText("Rastreo del pedido")).toBeInTheDocument();
    expect(screen.getByText("Tu pedido está en procesamiento.")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "contacto@cafeuna.cr" })).toHaveAttribute(
      "href",
      "mailto:contacto@cafeuna.cr",
    );
    expect(screen.getByText(/Si es incorrecto, comunicate con/i)).toBeInTheDocument();
    expect(mocks.obtenerCompraPorId).toHaveBeenCalledWith("10");
  });

  it("shows rejected tracking with an X in the detail", async () => {
    mocks.obtenerCompraPorId.mockResolvedValue({
      ...compra,
      estado: "Rechazado",
      metodoPago: "Comprobante",
      subtotal: 5000,
      impuestos: 650,
      items: [],
    });
    render(<HistorialComprasContent />);

    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/i }));

    expect(await screen.findByText("Tu pedido fue rechazado.")).toBeInTheDocument();
    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("filters by status tab", async () => {
    render(<HistorialComprasContent />);

    await screen.findByText("C-10");
    fireEvent.change(screen.getByRole("textbox", { name: "Número" }), { target: { value: "C-10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Procesando$/i }));

    await waitFor(() => {
      expect(mocks.obtenerMisCompras).toHaveBeenLastCalledWith(expect.objectContaining({
        numero: "C-10",
        estado: "Pendiente",
        page: 1,
        pageSize: 10,
      }));
    });
    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(3);
  });

  it("shows the empty state when there are no purchases", async () => {
    mocks.obtenerMisCompras.mockResolvedValue({ data: [], totalPages: 1 });
    render(<HistorialComprasContent />);

    expect(await screen.findByText("Todavía no tenés compras registradas.")).toBeInTheDocument();
  });

  it("shows an error and retries the history request", async () => {
    mocks.obtenerMisCompras
      .mockRejectedValueOnce(new Error("No se pudo cargar el historial."))
      .mockResolvedValueOnce({ data: [compra], totalPages: 1 });
    render(<HistorialComprasContent />);

    expect(await screen.findByText("No se pudo cargar el historial.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("C-10")).toBeInTheDocument();
    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(2);
  });

  it("redirects to login when there is no session on mount", async () => {
    mocks.getActiveSessionUser.mockReturnValue(null);
    render(<HistorialComprasContent />);

    expect(await screen.findByText("Iniciá sesión para ver tu historial de compras.")).toBeInTheDocument();
    await waitFor(() => {
      expect(sessionStorage.getItem("postLoginRedirect")).toBe("/perfil/compras");
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
    });
    expect(mocks.obtenerMisCompras).not.toHaveBeenCalled();
  });

  it("redirects to login when the session is invalidated", async () => {
    render(<HistorialComprasContent />);

    await screen.findByText("C-10");
    mocks.getActiveSessionUser.mockReturnValue(null);
    fireEvent(window, new Event("session-updated"));

    expect(await screen.findByText("Iniciá sesión para ver tu historial de compras.")).toBeInTheDocument();
    await waitFor(() => {
      expect(sessionStorage.getItem("postLoginRedirect")).toBe("/perfil/compras");
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
    });
    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale detail response after the account changes", async () => {
    let resolveDetail;
    mocks.obtenerCompraPorId.mockImplementation(() => new Promise((resolve) => {
      resolveDetail = resolve;
    }));
    render(<HistorialComprasContent />);

    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/i }));
    mocks.obtenerMisCompras.mockResolvedValueOnce({
      data: [{ ...compra, id: "20", numero: "C-20" }],
      totalPages: 1,
    });
    mocks.getActiveSessionUser.mockReturnValue({ id: "cliente-2", token: "jwt-2" });
    fireEvent(window, new Event("session-updated"));

    expect(await screen.findByText("C-20")).toBeInTheDocument();
    await act(async () => resolveDetail({ ...compra, items: [{ nombre: "Compra de cliente A" }] }));

    expect(screen.queryByText("Compra de cliente A")).not.toBeInTheDocument();
  });

  it("does not reload history for unrelated storage changes", async () => {
    render(<HistorialComprasContent />);

    await screen.findByText("C-10");
    fireEvent(window, new StorageEvent("storage", { key: "cart" }));

    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1);
  });

  it("does not reload history for same-account session events", async () => {
    render(<HistorialComprasContent />);

    await screen.findByText("C-10");
    mocks.getActiveSessionUser.mockReturnValue({ id: "cliente-1", token: "refreshed-jwt" });
    fireEvent(window, new Event("session-updated"));
    fireEvent(window, new StorageEvent("storage", { key: "user" }));
    await act(async () => {});

    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale history response after the account changes", async () => {
    let resolveHistoryForAccountA;
    mocks.obtenerMisCompras
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveHistoryForAccountA = resolve;
      }))
      .mockResolvedValueOnce({ data: [{ ...compra, id: "20", numero: "C-20" }], totalPages: 1 });
    render(<HistorialComprasContent />);

    await waitFor(() => expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1));
    mocks.getActiveSessionUser.mockReturnValue({ id: "cliente-2", token: "jwt-2" });
    fireEvent(window, new Event("session-updated"));

    expect(await screen.findByText("C-20")).toBeInTheDocument();
    await act(async () => resolveHistoryForAccountA({ data: [compra], totalPages: 1 }));

    expect(screen.queryByText("C-10")).not.toBeInTheDocument();
    expect(screen.getByText("C-20")).toBeInTheDocument();
  });
});

describe("HistorialComprasCliente", () => {
  beforeEach(() => {
    mocks.getActiveSessionUser.mockReset();
    mocks.navigate.mockReset();
    mocks.getActiveSessionUser.mockImplementation(() => ({ id: "cliente-1", role: "user", token: "jwt" }));
  });

  it("redirects admin users to the admin mis-compras route", async () => {
    mocks.getActiveSessionUser.mockReturnValue({ id: "1", role: "admin", token: "jwt" });
    render(<HistorialComprasCliente />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/admin/mis-compras", replace: true });
    });
  });
});
