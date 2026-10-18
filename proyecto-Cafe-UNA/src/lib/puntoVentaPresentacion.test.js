import { describe, expect, it } from "vitest";

import {
  esUrlGoogleMaps,
  mensajeDireccionPunto,
  mensajeImagenPunto,
  mensajeMapsPunto,
} from "./puntoVentaPresentacion";

describe("presentación de punto de venta", () => {
  it("acepta enlaces de Google Maps y rechaza otros destinos", () => {
    expect(esUrlGoogleMaps("https://www.google.com/maps/place/Editorial")).toBe(true);
    expect(esUrlGoogleMaps("https://maps.app.goo.gl/abc123")).toBe(true);
    expect(esUrlGoogleMaps("https://maps.google.com/?q=Heredia")).toBe(true);
    expect(esUrlGoogleMaps("https://evil.com/maps")).toBe(false);
    expect(esUrlGoogleMaps("http://www.google.com/maps/place/Editorial")).toBe(false);
    expect(esUrlGoogleMaps("javascript:alert(1)")).toBe(false);
    expect(mensajeMapsPunto("")).toBeNull();
    expect(mensajeMapsPunto("https://example.com")).toBe(
      "El enlace debe ser una URL válida de Google Maps.",
    );
  });

  it("valida imagen propia y dirección opcional", () => {
    expect(mensajeImagenPunto("/api/inventario/ubicaciones/imagenes/punto-1.webp")).toBeNull();
    expect(mensajeImagenPunto("/api/inventario/ubicaciones/imagenes/../x.jpg")).toBe(
      "La imagen del punto de venta no es válida.",
    );
    expect(mensajeDireccionPunto("")).toBeNull();
    expect(mensajeDireccionPunto("a".repeat(301))).toBe(
      "La dirección debe tener como máximo 300 caracteres.",
    );
  });
});