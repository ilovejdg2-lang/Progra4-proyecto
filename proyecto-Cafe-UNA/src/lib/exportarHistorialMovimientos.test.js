import { describe, expect, it } from "vitest";
import {
  construirCsvMovimientos,
  construirPdfMovimientos,
  etiquetaTipo,
} from "./exportarHistorialMovimientos";

describe("exportarHistorialMovimientos", () => {
  it("formats movement types to human-readable labels", () => {
    expect(etiquetaTipo("entrada")).toBe("Entrada");
    expect(etiquetaTipo("transferencia")).toBe("Transferencia");
    expect(etiquetaTipo("venta_presencial")).toBe("Venta presencial");
    expect(etiquetaTipo("venta_web")).toBe("Venta web");
    expect(etiquetaTipo("desconocido")).toBe("desconocido");
  });

  it("generates formatted CSV string with BOM and header", () => {
    const filas = [
      {
        fechaTexto: "2026-09-07 10:00",
        tipo: "entrada",
        productoNombre: "Café molido",
        cantidad: 50,
        origenNombre: "",
        destinoNombre: "Bodega Central",
        responsableNombre: "Admin Juan",
        notas: "Compra inicial",
      },
      {
        fechaTexto: "2026-09-07 11:30",
        tipo: "venta_web",
        productoNombre: "Café molido",
        cantidad: 2,
        origenNombre: "Bodega Central",
        destinoNombre: "",
        responsableNombre: "Sistema Web",
        notas: "Pedido #100",
      },
    ];

    const csv = construirCsvMovimientos(filas);
    expect(csv).toContain("\uFEFFFecha y Hora,Tipo de Movimiento,Producto,Cantidad,Ubicación Origen,Ubicación Destino,Responsable,Notas");
    expect(csv).toContain("2026-09-07 10:00,Entrada,Café molido,50,—,Bodega Central,Admin Juan,Compra inicial");
    expect(csv).toContain("2026-09-07 11:30,Venta web,Café molido,2,Bodega Central,—,Sistema Web,Pedido #100");
  });

  it("generates valid PDF structure string", () => {
    const pdf = construirPdfMovimientos({
      filas: [
        {
          fechaTexto: "2026-09-07",
          tipo: "transferencia",
          productoNombre: "Café 250g",
          cantidad: 10,
          origenNombre: "Bodega",
          destinoNombre: "Punto Venta",
          responsableNombre: "Carlos",
        },
      ],
      adminNombre: "Admin Test",
      fechaGeneracion: "2026-09-07 12:00",
      filtrosTexto: "tipo: Transferencia",
    });

    expect(pdf).toContain("%PDF-1.4");
    expect(pdf).toContain("Historial de movimientos");
    expect(pdf).toContain("Administrador: Admin Test");
    expect(pdf).toContain("%%EOF");
  });
});
