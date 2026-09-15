import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
  obtenerCompraPorId: vi.fn(),
  obtenerMisCompras: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }) => <a>{children}</a> }));
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
vi.mock("../../services/sessionService", () => ({
  SESSION_UPDATED_EVENT: "session-updated",
  getActiveSessionUser: (...args) => mocks.getActiveSessionUser(...args),
}));

import HistorialComprasCliente from "./HistorialComprasCliente";

const compra = {
  id: "10",
  numero: "C-10",
  fecha: "2026-09-14T15:38:00.000Z",
  cantidadProductos: 1,
  total: 5650,
  estado: "Pendiente",
};

describe("HistorialComprasCliente", () => {
  beforeEach(() => {
    mocks.getActiveSessionUser.mockReset();
    mocks.obtenerCompraPorId.mockReset();
    mocks.obtenerMisCompras.mockReset();
    mocks.getActiveSessionUser.mockImplementation(() => ({ id: "cliente-1", token: "jwt" }));
    mocks.obtenerMisCompras.mockResolvedValue({ data: [compra], totalPages: 1 });
  });

  it("loads the purchase history once after state updates", async () => {
    render(<HistorialComprasCliente />);

    expect(await screen.findByText("C-10")).toBeInTheDocument();
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
    render(<HistorialComprasCliente />);

    fireEvent.click(await screen.findByRole("button", { name: /Ver detalle/i }));

    expect(await screen.findByText("FUNDA-UNA")).toBeInTheDocument();
    expect(screen.getByText("Café de prueba")).toBeInTheDocument();
    expect(mocks.obtenerCompraPorId).toHaveBeenCalledWith("10");
  });

  it("reloads the history using the selected filters", async () => {
    render(<HistorialComprasCliente />);

    await screen.findByText("C-10");
    fireEvent.change(screen.getByRole("textbox", { name: "Número" }), { target: { value: "C-10" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Estado" }), { target: { value: "Pendiente" } });

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
    render(<HistorialComprasCliente />);

    expect(await screen.findByText("Todavía no tenés compras registradas.")).toBeInTheDocument();
  });

  it("shows an error and retries the history request", async () => {
    mocks.obtenerMisCompras
      .mockRejectedValueOnce(new Error("No se pudo cargar el historial."))
      .mockResolvedValueOnce({ data: [compra], totalPages: 1 });
    render(<HistorialComprasCliente />);

    expect(await screen.findByText("No se pudo cargar el historial.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("C-10")).toBeInTheDocument();
    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(2);
  });

  it("shows the sign-in gate after the active session is invalidated", async () => {
    render(<HistorialComprasCliente />);

    await screen.findByText("C-10");
    mocks.getActiveSessionUser.mockReturnValue(null);
    fireEvent(window, new Event("session-updated"));

    expect(await screen.findByText("Iniciá sesión para ver tu historial de compras.")).toBeInTheDocument();
    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale detail response after the account changes", async () => {
    let resolveDetail;
    mocks.obtenerCompraPorId.mockImplementation(() => new Promise((resolve) => {
      resolveDetail = resolve;
    }));
    render(<HistorialComprasCliente />);

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
    render(<HistorialComprasCliente />);

    await screen.findByText("C-10");
    fireEvent(window, new StorageEvent("storage", { key: "cart" }));

    expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1);
  });

  it("does not reload history for same-account session events", async () => {
    render(<HistorialComprasCliente />);

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
    render(<HistorialComprasCliente />);

    await waitFor(() => expect(mocks.obtenerMisCompras).toHaveBeenCalledTimes(1));
    mocks.getActiveSessionUser.mockReturnValue({ id: "cliente-2", token: "jwt-2" });
    fireEvent(window, new Event("session-updated"));

    expect(await screen.findByText("C-20")).toBeInTheDocument();
    await act(async () => resolveHistoryForAccountA({ data: [compra], totalPages: 1 }));

    expect(screen.queryByText("C-10")).not.toBeInTheDocument();
    expect(screen.getByText("C-20")).toBeInTheDocument();
  });
});
