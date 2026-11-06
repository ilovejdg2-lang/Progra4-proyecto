import { describe, expect, it } from "vitest";
import { bloqueVacio, conUids, normalizarHistoriaCompleta, sinUids } from "./historiaCompletaData";

const cruda = {
  portada: { titulo: "Historia" },
  cifras: [{ valor: "10", texto: "Fincas" }],
  hitos: [{ anio: "2020", texto: "Inicio" }],
  compost: [{ anio: "2021", kg: 5 }],
  capitulos: [{ id: "uno", titulo: "Uno", bloques: [{ tipo: "p", texto: "Hola" }] }],
};

describe("uids de edicion de la historia completa", () => {
  it("asigna un uid unico a cada fila y bloque editable", () => {
    const h = conUids(normalizarHistoriaCompleta(cruda));
    const uids = [h.cifras[0].uid, h.hitos[0].uid, h.compost[0].uid, h.capitulos[0].uid, h.capitulos[0].bloques[0].uid];
    expect(uids.every((u) => typeof u === "string" && u)).toBe(true);
    expect(new Set(uids).size).toBe(uids.length);
  });

  it("conserva el uid que ya tiene una fila", () => {
    const h = conUids(normalizarHistoriaCompleta(cruda));
    expect(conUids(h).cifras[0].uid).toBe(h.cifras[0].uid);
  });

  it("sinUids devuelve exactamente el payload normalizado que se persiste", () => {
    const normalizada = normalizarHistoriaCompleta(cruda);
    expect(sinUids(conUids(normalizada))).toEqual(normalizada);
  });

  it("sinUids quita el uid de los bloques nuevos", () => {
    const h = conUids(normalizarHistoriaCompleta(cruda));
    h.capitulos[0].bloques.push({ ...bloqueVacio("foto"), uid: "x" });
    expect(sinUids(h).capitulos[0].bloques[1]).toEqual(bloqueVacio("foto"));
  });
});
