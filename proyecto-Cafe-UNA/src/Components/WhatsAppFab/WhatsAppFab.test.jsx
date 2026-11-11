import { describe, expect, it } from "vitest";
import { digitosWhatsAppFooter, urlWhatsAppFooter } from "./WhatsAppFab";

describe("WhatsAppFab helpers", () => {
  it("arma el número con 506 para celulares de 8 dígitos", () => {
    expect(digitosWhatsAppFooter("8888-8888")).toBe("50688888888");
    expect(digitosWhatsAppFooter("+506 8888 8888")).toBe("50688888888");
  });

  it("arma el enlace wa.me con mensaje", () => {
    const href = urlWhatsAppFooter("88888888", "Hola Café UNA");
    expect(href).toBe(
      `https://wa.me/50688888888?text=${encodeURIComponent("Hola Café UNA")}`,
    );
  });

  it("devuelve vacío si no hay teléfono", () => {
    expect(urlWhatsAppFooter("", "Hola")).toBe("");
  });
});
