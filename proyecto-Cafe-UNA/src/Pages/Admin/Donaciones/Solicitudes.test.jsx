import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const serviceMocks = vi.hoisted(() => ({
  obtenerSolicitudesDonacionAdmin: vi.fn(),
  actualizarEstadoSolicitudDonacion: vi.fn(),
}));
const sessionMocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
}));
const pdfMocks = vi.hoisted(() => ({
  construirPdfReporteDonaciones: vi.fn(() => "%PDF-1.4 mock reporte"),
  construirPdfFichaDonacion: vi.fn(() => "%PDF-1.4 mock ficha"),
  descargarArchivo: vi.fn(),
  cargarLogoWebpParaPdf: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../../services/donacionesService", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ...serviceMocks,
  };
});

vi.mock("../../../services/sessionService", () => sessionMocks);

vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div data-testid="admin-layout">{children}</div>,
}));

vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ children }) => <>{children}</>,
}));

vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));

vi.mock("../../../lib/exportarDonacionesPdf", () => pdfMocks);

import AdminSolicitudesDonacion from "./Solicitudes";

const mockSolicitudes = [
  {
    id: 101,
    tipo: "Alimentos",
    descripcion: "Café en grano",
    fechaPropuesta: "2026-09-10",
    estado: "Pendiente",
    donanteNombre: "Carlos Rojas",
    detalles: {
      tipoDonante: "persona",
      nombre: "Carlos",
      primerApellido: "Rojas",
      numeroIdentificacion: "1-1111-2222",
      correo: "carlos@example.com",
      telefono: "8888-1111",
      cantidadEstimada: "5 kg",
      estadoArticulos: "Nuevo",
      metodoEntrega: "entrega",
      fechaSolicitud: "2026-09-08",
      valorEstimado: "20000",
    },
  },
  {
    id: 102,
    tipo: "Mobiliario",
    descripcion: "Estantes metálicos",
    fechaPropuesta: "2026-09-15",
    estado: "Aceptada",
    donanteNombre: "Asociación Estudiantil",
    detalles: {
      tipoDonante: "organizacion",
      numeroIdentificacion: "3-002-999999",
      correo: "asociacion@example.com",
      telefono: "2222-4444",
      cantidadEstimada: "2 estantes",
      estadoArticulos: "Bueno",
      metodoEntrega: "recoleccion",
      fechaSolicitud: "2026-09-07",
      valorEstimado: "80000",
    },
  },
];

describe("AdminSolicitudesDonacion", () => {
  beforeEach(() => {
    sessionMocks.getActiveSessionUser.mockReturnValue({
      id: 1,
      name: "Administrador Test",
      roles: ["SuperAdmin", "administrar_solicitudes_donaciones", "ver_solicitudes_donacion"],
    });
    serviceMocks.obtenerSolicitudesDonacionAdmin.mockResolvedValue(mockSolicitudes);
  });

  it("muestra métricas de estado, solicitudes y permite filtrar por búsqueda", async () => {
    const user = userEvent.setup();
    render(<AdminSolicitudesDonacion />);

    expect(serviceMocks.obtenerSolicitudesDonacionAdmin).toHaveBeenCalled();

    // Esperar a que carguen los datos
    await waitFor(() => {
      expect(screen.getAllByText("Carlos Rojas").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Asociación Estudiantil").length).toBeGreaterThanOrEqual(1);
    });

    // Validar tarjetas de métricas superiores
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("Pendiente").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Aceptada").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Rechazada").length).toBeGreaterThanOrEqual(1);

    // Validar botón de exportar PDF
    expect(screen.getByRole("button", { name: /exportar pdf/i })).toBeInTheDocument();

    // Buscar "Carlos" en el input
    const searchInput = screen.getByRole("searchbox", { name: /buscar/i });
    await user.type(searchInput, "Carlos");

    // "Carlos Rojas" debe estar visible y "Asociación Estudiantil" oculto
    expect(screen.getAllByText("Carlos Rojas").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText("Asociación Estudiantil").length).toBe(0);
  });

  it("permite hacer clic en Exportar PDF y dispara la descarga", async () => {
    const user = userEvent.setup();
    render(<AdminSolicitudesDonacion />);

    await waitFor(() => {
      expect(screen.getAllByText("Carlos Rojas").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Asociación Estudiantil").length).toBeGreaterThanOrEqual(1);
    });

    const exportBtn = screen.getByRole("button", { name: /exportar pdf/i });
    await user.click(exportBtn);

    expect(pdfMocks.construirPdfReporteDonaciones).toHaveBeenCalled();
    expect(pdfMocks.descargarArchivo).toHaveBeenCalledWith(
      expect.stringMatching(/^reporte-donaciones-.*\.pdf$/),
      expect.any(String),
      "application/pdf",
      { binario: true },
    );
  });
});
