import { beforeEach, describe, expect, it } from "vitest";
import {
  archivoADataUrl,
  claveBorradorPropuesta,
  dataUrlAArchivo,
  eliminarBorradorPropuesta,
  guardarBorradorPropuesta,
  leerBorradorPropuesta,
} from "./propuestaProductorDraft";

describe("borrador de propuesta de productor", () => {
  beforeEach(() => {
    eliminarBorradorPropuesta(7);
    eliminarBorradorPropuesta(8);
  });

  it("separa el almacenamiento por usuario", () => {
    expect(claveBorradorPropuesta(7)).toBe("cafe-una:propuesta-productor-draft:7");
    guardarBorradorPropuesta(7, { form: { nombre: "A" }, paso: 0 });
    guardarBorradorPropuesta(8, { form: { nombre: "B" }, paso: 2 });
    expect(leerBorradorPropuesta(7).form.nombre).toBe("A");
    expect(leerBorradorPropuesta(8).paso).toBe(2);
  });

  it("ignora usuarios vacíos y elimina el borrador", () => {
    expect(claveBorradorPropuesta("")).toBe("");
    expect(guardarBorradorPropuesta("", { form: {} })).toBe(false);
    guardarBorradorPropuesta(7, { form: { nombre: "X" }, paso: 1 });
    eliminarBorradorPropuesta(7);
    expect(leerBorradorPropuesta(7)).toBeNull();
  });

  it("redondea imagen a data URL y la recupera como File", async () => {
    const archivo = new File([new Uint8Array([1, 2, 3, 4])], "finca.png", { type: "image/png" });
    const meta = await archivoADataUrl(archivo);
    expect(meta.name).toBe("finca.png");
    expect(meta.dataUrl.startsWith("data:")).toBe(true);
    const recuperado = await dataUrlAArchivo(meta);
    expect(recuperado).toBeInstanceOf(File);
    expect(recuperado.name).toBe("finca.png");
    expect(recuperado.type).toBe("image/png");
  });
});
