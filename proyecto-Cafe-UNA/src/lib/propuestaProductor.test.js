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
    expect(validarEnlaceUbicacion("https://maps.google.com.ejemplo.com/maps")).toMatch(/Google Maps o Waze/);
    expect(validarEnlaceUbicacion("javascript:alert(1)")).not.toBe("");
  });

  it("no marca error en redes opcionales vacías", () => {
    const archivo = new File([new Uint8Array(12)], "cafe.jpg", { type: "image/jpeg" });
    expect(validarFormularioPropuesta(formOk, archivo)).toEqual({});
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
