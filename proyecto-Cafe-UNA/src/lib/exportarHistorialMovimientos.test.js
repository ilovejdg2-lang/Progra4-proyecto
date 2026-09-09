import { describe, expect, it } from "vitest";
import {
  construirCsvMovimientos,
  construirPdfMovimientos,
  etiquetaTipo,
  obtenerLogoDefault,
} from "./exportarHistorialMovimientos";

describe("exportarHistorialMovimientos", () => {
  const mockFilas = [
    {
      id: 1,
      fecha: "2026-09-08T10:30:00Z",
      fechaTexto: "08/09/2026, 10:30 a. m.",
      tipo: "entrada",
      productoNombre: "Café Clásico 500g",
      cantidad: 25,
      origenNombre: "Proveedor Sol",
      destinoNombre: "Bodega Central",
      responsableNombre: "Admin Usuario",
      notas: "Lote nuevo, revisión OK",
    },
    {
      id: 2,
      fecha: "2026-09-08T14:15:00Z",
      fechaTexto: "08/09/2026, 02:15 p. m.",
      tipo: "venta_presencial",
      productoNombre: "Café Especial Tarrazú",
      cantidad: 2,
      origenNombre: "Tienda Principal",
      destinoNombre: "Cliente Final",
      responsableNombre: "Vendedor 1",
      notas: "",
    },
  ];

  it("etiquetaTipo traduce correctamente los tipos de movimiento", () => {
    expect(etiquetaTipo("entrada")).toBe("Entrada");
    expect(etiquetaTipo("transferencia")).toBe("Transferencia");
    expect(etiquetaTipo("venta_presencial")).toBe("Venta presencial");
    expect(etiquetaTipo("venta_web")).toBe("Venta web");
    expect(etiquetaTipo("otro")).toBe("otro");
  });

  it("construirCsvMovimientos genera CSV con BOM UTF-8 y cabeceras en mayúsculas", () => {
    const csv = construirCsvMovimientos(mockFilas);

    // Debe iniciar con BOM UTF-8 (\uFEFF) para compatibilidad con Excel
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const lineas = csv.replace("\uFEFF", "").split("\r\n");
    expect(lineas[0]).toBe(
      "FECHA,TIPO DE MOVIMIENTO,PRODUCTO,CANTIDAD,ORIGEN,DESTINO,RESPONSABLE,NOTAS",
    );

    expect(lineas[1]).toContain("08/09/2026");
    expect(lineas[1]).toContain("Entrada");
    expect(lineas[1]).toContain("Café Clásico 500g");
    expect(lineas[1]).toContain("25");
    expect(lineas[1]).toContain('"Lote nuevo, revisión OK"'); // comas escapadas con comillas

    expect(lineas[2]).toContain("Venta presencial");
    expect(lineas[2]).toContain("Café Especial Tarrazú");
  });

  it("construirPdfMovimientos genera un PDF válido con logo institucional y formato apaisado", () => {
    const pdf = construirPdfMovimientos({
      filas: mockFilas,
      adminNombre: "SuperAdmin",
      fechaGeneracion: "08/09/2026, 8:00 p. m.",
      filtrosTexto: "Tipo: Entrada",
      logoData: obtenerLogoDefault(),
    });

    expect(typeof pdf).toBe("string");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.includes("startxref")).toBe(true);
    expect(pdf.includes("%%EOF")).toBe(true);
    expect(pdf.includes("/ImLogo")).toBe(true);
    expect(pdf.includes("Reporte Administrativo de Movimientos de Inventario")).toBe(true);
    expect(pdf.includes("SuperAdmin")).toBe(true);
    expect(pdf.includes("FECHA")).toBe(true);
    expect(pdf.includes("TIPO DE MOVIMIENTO")).toBe(true);
    expect(pdf.includes("P")).toBe(true);
  });
});
