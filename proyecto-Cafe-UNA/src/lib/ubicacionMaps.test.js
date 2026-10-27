import { describe, expect, it } from "vitest";
import {
  coordenadasDeProductor,
  esUrlMapasOWaze,
  estaEnCostaRica,
  extraerCoordenadasDeEnlace,
} from "./ubicacionMaps";

describe("ubicacionMaps", () => {
  it("extrae !3d!4d y no el centro de cámara", () => {
    expect(
      extraerCoordenadasDeEnlace(
        "https://www.google.com/maps/place/X/@9.9,-84.1,17z/data=!3d9.928!4d-84.09",
      ),
    ).toEqual({ latitud: 9.928, longitud: -84.09 });
    expect(extraerCoordenadasDeEnlace("https://www.google.com/maps/@9.9,-84.1,12z")).toBeNull();
  });

  it("lee el destino de una ruta /maps/dir", () => {
    expect(
      extraerCoordenadasDeEnlace(
        "https://www.google.com/maps/dir/10.1,-85.4/Lugar/@9.9,-85.2,8z/data=!2m2!1d-84.0992619!2d10.0135836",
      ),
    ).toEqual({ latitud: 10.0135836, longitud: -84.0992619 });
  });

  it("acepta hosts de Maps CR y Waze", () => {
    expect(esUrlMapasOWaze(new URL("https://maps.google.co.cr/?q=9.9,-84.1"))).toBe(true);
    expect(esUrlMapasOWaze(new URL("https://www.google.co.cr/maps/place/X"))).toBe(true);
    expect(esUrlMapasOWaze(new URL("https://ul.waze.com/ul?ll=9.9,-84.1"))).toBe(true);
    expect(esUrlMapasOWaze(new URL("https://ejemplo.com/maps"))).toBe(false);
  });

  it("valida Costa Rica y productores con coordenadas", () => {
    expect(estaEnCostaRica(9.93, -84.08)).toBe(true);
    expect(estaEnCostaRica(40, -74)).toBe(false);
    expect(coordenadasDeProductor({ latitud: 9.9, longitud: -84 })).toEqual({
      latitud: 9.9,
      longitud: -84,
    });
    expect(coordenadasDeProductor({ nombre: "Sin pin" })).toBeNull();
  });
});
