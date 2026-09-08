import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerHistorialMovimientosMock = vi.fn();
const obtenerUbicacionesMock = vi.fn();
const descargarArchivoMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/admin/historial-movimientos" }),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock("../../../services/movimientosService", () => ({
  obtenerHistorialMovimientos: (...args) => obtenerHistorialMovimientosMock(...args),
}));

vi.mock("../../../services/productosService", () => ({
  obtenerUbicaciones: (...args) => obtenerUbicacionesMock(...args),
}));

vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ id: 1, name: "Admin Test", roles: ["Admin"] }),
}));

vi.mock("../../../lib/permisos", () => ({
  rolesDeUsuario: () => ["Admin"],
  tienePermiso: () => true,
}));

vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));

vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock("../../../lib/exportarHistorialMovimientos", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    descargarArchivo: (...args) => descargarArchivoMock(...args),
  };
});

import AdminHistorialMovimientos from "./HistorialMovimientos";

describe("AdminHistorialMovimientos Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUbicacionesMock.mockResolvedValue([
      { id: 1, name: "Bodega Central" },
      { id: 2, name: "Punto Editorial" },
    ]);
    obtenerHistorialMovimientosMock.mockResolvedValue({
      items: [
        {
          id: "101",
          fecha: "2026-09-07T10:00:00.000Z",
          tipo: "entrada",
          productoId: "5",
          productoNombre: "Café Orgánico 500g",
          cantidad: 20,
          ubicacionOrigenId: null,
          origenNombre: "",
          ubicacionDestinoId: 1,
          destinoNombre: "Bodega Central",
          responsableId: 1,
          responsableNombre: "Admin Test",
          notas: "Carga semanal",
        },
        {
          id: "102",
          fecha: "2026-09-07T11:00:00.000Z",
          tipo: "venta_web",
          productoId: "5",
          productoNombre: "Café Orgánico 500g",
          cantidad: 2,
          ubicacionOrigenId: 1,
          origenNombre: "Bodega Central",
          ubicacionDestinoId: null,
          destinoNombre: "",
          responsableId: null,
          responsableNombre: "Cliente Web",
          notas: "Orden #55",
        },
      ],
      total: 2,
      page: 1,
      limit: 25,
    });
  });

  it("renders movement history table and header title", async () => {
    render(<AdminHistorialMovimientos />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Historial de Movimientos/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText("Café Orgánico 500g")[0]).toBeInTheDocument();
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Venta web")).toBeInTheDocument();
    expect(screen.getAllByText("Bodega Central")[0]).toBeInTheDocument();
    expect(screen.getByText("Admin Test")).toBeInTheDocument();
  });

  it("renders read-only view without edit or delete buttons", async () => {
    render(<AdminHistorialMovimientos />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Historial de Movimientos/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it("triggers CSV and PDF export on button click", async () => {
    const user = userEvent.setup();
    render(<AdminHistorialMovimientos />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Historial de Movimientos/i })).toBeInTheDocument();
    });

    const exportCsvBtn = screen.getByRole("button", { name: /exportar csv/i });
    await user.click(exportCsvBtn);

    await waitFor(() => {
      expect(descargarArchivoMock).toHaveBeenCalledWith(
        expect.stringMatching(/^historial-movimientos-.*\.csv$/),
        expect.stringContaining("Café Orgánico 500g"),
        "text/csv;charset=utf-8",
      );
    });

    const exportPdfBtn = screen.getByRole("button", { name: /exportar pdf/i });
    await user.click(exportPdfBtn);

    await waitFor(() => {
      expect(descargarArchivoMock).toHaveBeenCalledWith(
        expect.stringMatching(/^historial-movimientos-.*\.pdf$/),
        expect.anything(),
        "application/pdf",
        { binario: true },
      );
    });
  });
});
