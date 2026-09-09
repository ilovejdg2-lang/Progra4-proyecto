import { describe, expect, it } from "vitest";
import {
  construirPdfFichaDonacion,
  construirPdfReporteDonaciones,
} from "./exportarDonacionesPdf";

describe("exportarDonacionesPdf", () => {
  const mockSolicitudes = [
    {
      id: 1,
      tipo: "Alimentos",
      descripcion: "Café en grano y azúcar orgánica",
      fechaPropuesta: "2026-09-10",
      estado: "Pendiente",
      donanteNombre: "María Rodríguez",
      detalles: {
        tipoDonante: "persona",
        nombre: "María",
        primerApellido: "Rodríguez",
        segundoApellido: "Pérez",
        numeroIdentificacion: "1-1234-0567",
        tipoIdentificacion: "cedula",
        correo: "maria@example.com",
        telefono: "8888-9999",
        cantidadEstimada: "10 paquetes",
        estadoArticulos: "Nuevo",
        metodoEntrega: "entrega",
        fechaSolicitud: "2026-09-08",
        fechaEntrega: "2026-09-10",
        horaEntrega: "10:00",
        valorEstimado: "25000",
      },
    },
    {
      id: 2,
      tipo: "Mobiliario",
      descripcion: "Mesas de madera para sala de estudio",
      fechaPropuesta: "2026-09-12",
      estado: "Aceptada",
      donanteNombre: "Empresa S.A.",
      detalles: {
        tipoDonante: "organizacion",
        numeroIdentificacion: "3-101-123456",
        tipoIdentificacion: "juridica",
        correo: "contacto@empresa.com",
        telefono: "2222-3333",
        cantidadEstimada: "4 mesas",
        estadoArticulos: "Excelente",
        metodoEntrega: "recoleccion",
        direccionRecoleccion: "San José, 100m norte del parque",
        fechaSolicitud: "2026-09-07",
        fechaEntrega: "2026-09-12",
        horaEntrega: "manana",
        valorEstimado: "150000",
      },
    },
  ];

  it("genera un PDF de reporte válido con cabecera y trailer", () => {
    const pdf = construirPdfReporteDonaciones({
      solicitudes: mockSolicitudes,
      adminNombre: "SuperAdmin",
      fechaGeneracion: "08/09/2026, 8:00 p. m.",
      filtrosTexto: "Estado: Pendiente",
      resumenEstados: { Total: 2, Pendiente: 1, Aceptada: 1, Rechazada: 0 },
    });

    expect(typeof pdf).toBe("string");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.includes("startxref")).toBe(true);
    expect(pdf.includes("%%EOF")).toBe(true);
    expect(pdf.includes("Reporte Administrativo de Solicitudes de Donaci")).toBe(true);
    expect(pdf.includes("/ImLogo")).toBe(true);
    expect(pdf.includes("Caf")).toBe(true);
  });

  it("genera una ficha individual de donación válida con sus secciones y logo", () => {
    const pdf = construirPdfFichaDonacion({
      solicitud: mockSolicitudes[0],
      adminNombre: "SuperAdmin",
      fechaGeneracion: "08/09/2026, 8:00 p. m.",
    });

    expect(typeof pdf).toBe("string");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.includes("startxref")).toBe(true);
    expect(pdf.includes("%%EOF")).toBe(true);
    expect(pdf.includes("/ImLogo")).toBe(true);
    expect(pdf.includes("Ficha de Solicitud de Donaci")).toBe(true);
    expect(pdf.includes("1. INFORMACI")).toBe(true);
    expect(pdf.includes("2. DETALLES")).toBe(true);
    expect(pdf.includes("3. LOG")).toBe(true);
  });
});
