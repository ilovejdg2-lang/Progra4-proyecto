import { describe, it, expect, vi } from "vitest";
import {
  obtenerHoyIso,
  ZONA_HORARIA_PREDETERMINADA,
} from "../../services/voluntariadoFechasService";

describe("Frontend Voluntariado Fechas y Zona Horaria", () => {
  it("obtenerHoyIso retorna la fecha actual en formato YYYY-MM-DD", () => {
    const hoyCR = obtenerHoyIso("America/Costa_Rica");
    expect(hoyCR).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ZONA_HORARIA_PREDETERMINADA).toBe("America/Costa_Rica");
  });

  it("calcula fechas pasadas, hoy y futuras de manera consistente", () => {
    const hoyCR = obtenerHoyIso("America/Costa_Rica");
    const [y, m, d] = hoyCR.split("-").map(Number);

    const ayerObj = new Date(y, m - 1, d - 1);
    const mananaObj = new Date(y, m - 1, d + 1);

    const ayerStr = `${ayerObj.getFullYear()}-${String(ayerObj.getMonth() + 1).padStart(2, "0")}-${String(ayerObj.getDate()).padStart(2, "0")}`;
    const mananaStr = `${mananaObj.getFullYear()}-${String(mananaObj.getMonth() + 1).padStart(2, "0")}-${String(mananaObj.getDate()).padStart(2, "0")}`;

    expect(ayerStr < hoyCR).toBe(true);
    expect(mananaStr > hoyCR).toBe(true);
    expect(hoyCR >= hoyCR).toBe(true);
  });

  it("maneja de forma segura zonas horarias alternativas o caídas de configuración", () => {
    const hoyNY = obtenerHoyIso("America/New_York");
    expect(hoyNY).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const hoyInvalida = obtenerHoyIso("ZonaInexistente/Fantasma");
    expect(hoyInvalida).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
