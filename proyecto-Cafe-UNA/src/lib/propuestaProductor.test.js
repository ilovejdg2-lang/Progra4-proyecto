import { describe, expect, it } from "vitest";

import {
  urlImagenPropuestaConSesion,
  urlImagenPublica,
  validarEnlaceUbicacion,
  validarFormularioPropuesta,
  validarWhatsapp,
} from "./propuestaProductor";

const formOk = {
  nombre: "Cafetal Don Juan",
  descripcion: "Café de altura.",
  provincia: "San José",
  canton: "Desamparados",
  distrito: "San Miguel",
  direccion: "Frente al parque",
  enlaceUbicacion: "https://www.google.com/maps/place/Cafe",
  latitud: "9.93",
  longitud: "-84.08",
  facebook: "",
  instagram: "",
  whatsapp: "",
  sitioWeb: "",
  correo: "hola@cafetal.com",
  telefono: "8888 8888",
  aceptaTerminos: true,
};

describe("validación de propuesta de productor", () => {
  it("acepta mapas y waze y rechaza un dominio fraudulento", () => {
    expect(validarEnlaceUbicacion("https://maps.app.goo.gl/abc")).toBe("");
    expect(validarEnlaceUbicacion("https://waze.com/ul/abc")).toBe("");
    expect(validarEnlaceUbicacion("https://maps.google.co.cr/?q=9.9,-84.1")).toBe("");
    expect(validarEnlaceUbicacion("https://www.google.co.cr/maps/place/Cafe")).toBe("");
    expect(validarEnlaceUbicacion("https://ul.waze.com/ul?ll=9.9,-84.1")).toBe("");
    expect(validarEnlaceUbicacion("https://maps.google.com.ejemplo.com/maps")).toMatch(
      /Google Maps ni de Waze|Google Maps o Waze/,
    );
    expect(validarEnlaceUbicacion("https://ejemplo.com/maps")).toMatch(/Google Maps/);
    expect(validarEnlaceUbicacion("javascript:alert(1)")).not.toBe("");
  });

  it("no marca error en redes opcionales vacías si hay pin confirmado", () => {
    const archivo = new File([new Uint8Array(12)], "cafe.jpg", { type: "image/jpeg" });
    expect(validarFormularioPropuesta(formOk, archivo)).toEqual({});
  });

  it("exige confirmar el punto en el mapa si el enlace no trae coordenadas", () => {
    const archivo = new File([new Uint8Array(12)], "cafe.jpg", { type: "image/jpeg" });
    const errores = validarFormularioPropuesta(
      { ...formOk, latitud: "", longitud: "" },
      archivo,
    );
    expect(errores.enlaceUbicacion).toMatch(/mapa|Costa Rica/);
  });

  it("rechaza coordenadas fuera de Costa Rica", () => {
    const archivo = new File([new Uint8Array(12)], "cafe.jpg", { type: "image/jpeg" });
    const errores = validarFormularioPropuesta(
      { ...formOk, latitud: "40.7", longitud: "-74.0" },
      archivo,
    );
    expect(errores.enlaceUbicacion).toMatch(/Costa Rica/);
  });

  it("exige código de país en WhatsApp y conserva el formulario si falta la imagen", () => {
    expect(validarWhatsapp("")).toBe("");
    expect(validarWhatsapp("88888888")).toMatch(/código de país/);
    const errores = validarFormularioPropuesta({ ...formOk, nombre: "   " }, null);
    expect(errores.nombre).toBeTruthy();
    expect(errores.imagen).toBeTruthy();
  });

  it("resuelve URLs de imagen absolutas y conserva las de Supabase", () => {
    const cdn =
      "https://mtrbjaaujtvgpvsiwfdm.supabase.co/storage/v1/object/public/documentos/propuestas/a.png";
    expect(urlImagenPublica(cdn)).toBe(cdn);
    expect(urlImagenPublica("/api/productores/imagenes/a.png")).toMatch(/\/api\/productores\/imagenes\/a\.png$/);
    expect(urlImagenPropuestaConSesion(cdn, "jwt-demo")).toBe(cdn);
    expect(urlImagenPropuestaConSesion("/api/productores/imagenes/a.png", "jwt-demo")).toContain("token=jwt-demo");
  });
});
