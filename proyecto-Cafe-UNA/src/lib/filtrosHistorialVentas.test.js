import { describe, expect, it } from "vitest";

import {
  filtrarVentasLocales,
  hayFiltrosHistorial,
  parametrosListadoVentas,
} from "./filtrosHistorialVentas";

const ventas = [
  {
    numero: "VP-1",
    estado: "Entregado",
    fecha: "2026-03-01T10:00:00.000Z",
    clienteNombre: "Ana",
    ubicacionCodigo: "POS_FUNA_UNA",
    vendedorId: "7",
    items: [{ categoria: "Café" }],
  },
  {
    numero: "C-2",
    estado: "Pendiente",
    fecha: "2026-04-02T10:00:00.000Z",
    clienteNombre: "Luis",
    ubicacionCodigo: "POS_EDITORIAL",
    vendedorId: "8",
    items: [{ categoria: "Té" }],
  },
];

describe("filtros del historial de ventas", () => {
  it("combina punto, categoría, vendedor, fecha y estado en la consulta", () => {
    expect(
      parametrosListadoVentas({
        page: 2,
        pageSize: 10,
        esPendientes: false,
        locationCode: "",
        filtros: {
          busqueda: "Ana",
          estado: "Entregado",
          desde: "2026-01-01",
          hasta: "2026-03-31",
          punto: "POS_FUNA_UNA",
          categoria: "Café",
          vendedorId: "7",
        },
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      q: "Ana",
      estado: "Entregado",
      desde: "2026-01-01",
      hasta: "2026-03-31",
      ubicacionCodigo: "POS_FUNA_UNA",
      categoria: "Café",
      vendedorId: "7",
    });
  });

  it("conserva el punto de la ruta y el estado pendiente", () => {
    expect(
      parametrosListadoVentas({
        page: 1,
        pageSize: 10,
        esPendientes: true,
        locationCode: "POS_EDITORIAL",
        filtros: {
          busqueda: "",
          estado: "todos",
          desde: "",
          hasta: "",
          punto: "POS_FUNA_UNA",
          categoria: "",
          vendedorId: "",
        },
      }),
    ).toMatchObject({
      estado: "Pendiente",
      ubicacionCodigo: "POS_EDITORIAL",
    });
  });

  it("limpia vuelve a verse como conjunto completo", () => {
    expect(
      hayFiltrosHistorial(
        {
          busqueda: "",
          estado: "todos",
          desde: "",
          hasta: "",
          punto: "",
          categoria: "",
          vendedorId: "",
        },
        { esPendientes: false, locationCode: "" },
      ),
    ).toBe(false);
  });

  it("deja solo la venta que coincide con los tres criterios", () => {
    expect(
      filtrarVentasLocales(ventas, {
        filtros: { punto: "POS_FUNA_UNA", categoria: "café", vendedorId: "7", estado: "todos", busqueda: "", desde: "", hasta: "" },
      }).map((venta) => venta.numero),
    ).toEqual(["VP-1"]);
  });
});