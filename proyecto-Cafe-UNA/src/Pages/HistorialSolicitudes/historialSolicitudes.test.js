import { describe, expect, it } from "vitest";
import {
  enlaceDetalleSolicitud,
  OPCIONES_TIPO,
} from "./historialSolicitudes";

describe("historialSolicitudes", () => {
  it("incluye filtros de Propuesta y Documentación", () => {
    const valores = OPCIONES_TIPO.map((opcion) => opcion.value);
    expect(valores).toEqual(
      expect.arrayContaining(["propuesta", "documentacion", "visita", "donacion"]),
    );
    expect(OPCIONES_TIPO.find((o) => o.value === "propuesta")?.label).toBe(
      "Propuesta",
    );
    expect(OPCIONES_TIPO.find((o) => o.value === "documentacion")?.label).toBe(
      "Documentación",
    );
  });

  it("enlaza el detalle de una propuesta a /perfil/propuestas/$propuestaId", () => {
    expect(
      enlaceDetalleSolicitud({
        tipo: "propuesta",
        identificador: "44",
      }),
    ).toEqual({
      to: "/perfil/propuestas/$propuestaId",
      params: { propuestaId: "44" },
    });
    expect(
      enlaceDetalleSolicitud({
        tipo: "documentacion",
        identificador: "9",
      }),
    ).toBeNull();
  });
});
