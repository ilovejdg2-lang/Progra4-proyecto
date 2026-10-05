import { describe, expect, it } from "vitest";

import { construirPdfResumenCompra, presentarCompra } from "./resumenCompraPdf";

const compra = {
  numero: "C-99",
  fecha: "2026-10-04T18:00:00.000Z",
  estado: "Pendiente",
  clienteNombre: "Ana Cliente",
  clienteCorreo: "ana@una.cr",
  metodoPago: "Comprobante",
  ubicacionNombre: "FUNA-UNA",
  subtotal: 5309.73,
  impuestos: 690.27,
  total: 6000,
  cliente: {
    telefono: "8888-0000",
    identificacion: "1-1111-1111",
  },
  items: [
    {
      nombre: "Cafe molido",
      cantidad: 2,
      precioUnitario: 3000,
      subtotal: 6000,
    },
  ],
};

describe("resumen de compra", () => {
  it("incluye los datos de la orden confirmada", () => {
    const vista = presentarCompra(compra);
    expect(vista.meta).toEqual(
      expect.arrayContaining([
        ["Número de orden", "C-99"],
        ["Cliente", "Ana Cliente"],
        ["Correo", "ana@una.cr"],
        ["Teléfono", "8888-0000"],
        ["Identificación", "1-1111-1111"],
        ["Punto de venta", "FUNA-UNA"],
        ["Método de pago", "Comprobante"],
      ]),
    );
    expect(vista.items).toHaveLength(1);
    expect(vista.total).toBe(6000);
  });

  it("arma un PDF descargable con el numero y el cliente", () => {
    const pdf = construirPdfResumenCompra({ compra, logoData: null });
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("C-99");
    expect(pdf).toContain("ana@una.cr");
    expect(pdf).toContain("FUNA-UNA");
    expect(pdf).toContain("Cafe molido");
    expect(pdf).toContain("CRC 6.000,00");
    expect(pdf).not.toContain("?");
  });
});
