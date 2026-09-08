import { describe, expect, it, vi } from "vitest";

import { normalizarVisita } from "./visitasService";

describe("visitasService", () => {
  it("normaliza una solicitud de visita cruda desde la API", () => {
    const raw = {
      Id: 15,
      EncargadoNombre: " Ana López ",
      EncargadoIdentificacion: "123456789",
      EncargadoEmail: "ana@ejemplo.com",
      EncargadoTelefono: "8888-7777",
      TipoVisitante: "Internacional",
      PaisProcedencia: "España",
      CiudadProvincia: "Madrid",
      CantidadVisitantes: 4,
      TipoGrupo: "Universidad",
      FechaVisita: "2026-12-01",
      HoraPreferida: "Mañana (8:00 a. m. – 11:30 a. m.)",
      MotivoVisita: "Investigación",
      RequiereAccesibilidad: true,
      RequiereParqueoBus: false,
      RequiereGuia: true,
      Estado: "Pendiente",
    };

    const norm = normalizarVisita(raw);
    expect(norm).toEqual({
      id: "15",
      userId: null,
      fechaSolicitud: "",
      estado: "Pendiente",
      encargadoNombre: "Ana López",
      encargadoIdentificacion: "123456789",
      encargadoEmail: "ana@ejemplo.com",
      encargadoTelefono: "8888-7777",
      encargadoInstitucion: "",
      tipoVisitante: "Internacional",
      paisProcedencia: "España",
      ciudadProvincia: "Madrid",
      cantidadVisitantes: 4,
      tipoGrupo: "Universidad",
      tipoGrupoOtro: "",
      fechaVisita: "2026-12-01",
      horaPreferida: "Mañana (8:00 a. m. – 11:30 a. m.)",
      fechaAlternativa: "",
      duracionEstimada: "",
      areaVisita: "",
      motivoVisita: "Investigación",
      motivoOtro: "",
      requiereAccesibilidad: true,
      requiereParqueoBus: false,
      requiereGuia: true,
      observaciones: "",
      observacionesAdmin: "",
    });
  });

  it("retorna null si la respuesta no tiene ID", () => {
    expect(normalizarVisita({})).toBeNull();
  });
});
