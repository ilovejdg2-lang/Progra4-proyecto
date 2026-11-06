import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminHistoriaCompleta from "./AdminHistoriaCompleta";
import { actualizarHistoriaCompleta, obtenerHistoriaCompleta } from "../../../services/informacionService";

vi.mock("../layouts/AdminLayout", () => ({ AdminLayout: ({ children }) => <div>{children}</div> }));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({ AdminPageGate: ({ children }) => <div>{children}</div> }));
vi.mock("../../../hooks/useAdminPageGate", () => ({ useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }) }));
vi.mock("../../../services/informacionService", () => ({
  obtenerHistoriaCompleta: vi.fn(),
  actualizarHistoriaCompleta: vi.fn(),
  subirImagenInformacion: vi.fn(),
}));

const historia = {
  portada: { titulo: "Historia" },
  cifras: [{ valor: "10", texto: "Fincas" }, { valor: "20", texto: "Socios" }],
  hitos: [],
  compost: [],
  capitulos: [],
};

const valores = () => screen.getAllByRole("textbox", { name: "Valor" }).map((el) => el.value);

describe("AdminHistoriaCompleta row identity", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    obtenerHistoriaCompleta.mockResolvedValue(historia);
    actualizarHistoriaCompleta.mockImplementation(async (payload) => payload);
  });

  it("keeps each row's DOM node when rows are reordered, added and removed", async () => {
    render(<AdminHistoriaCompleta />);
    await waitFor(() => expect(valores()).toEqual(["10", "20"]));
    const [primera, segunda] = screen.getAllByRole("textbox", { name: "Valor" });

    fireEvent.click(screen.getAllByRole("button", { name: "Bajar" })[0]);
    expect(valores()).toEqual(["20", "10"]);
    expect(screen.getAllByRole("textbox", { name: "Valor" })).toEqual([segunda, primera]);

    fireEvent.change(primera, { target: { value: "11" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar cifra" }));
    expect(valores()).toEqual(["20", "11", ""]);
    expect(screen.getAllByRole("textbox", { name: "Valor" }).slice(0, 2)).toEqual([segunda, primera]);

    fireEvent.click(screen.getAllByRole("button", { name: "Quitar" })[0]);
    expect(valores()).toEqual(["11", ""]);
    expect(screen.getAllByRole("textbox", { name: "Valor" })[0]).toBe(primera);
  });

  it("does not send the client-only uid to the API", async () => {
    render(<AdminHistoriaCompleta />);
    await waitFor(() => expect(valores()).toEqual(["10", "20"]));
    fireEvent.click(screen.getByRole("button", { name: "Agregar hito" }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar capítulo" }));
    fireEvent.change(screen.getAllByRole("textbox", { name: "Valor" })[0], { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(actualizarHistoriaCompleta).toHaveBeenCalledTimes(1));
    const payload = actualizarHistoriaCompleta.mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain("uid");
    expect(payload.cifras[0]).toEqual({ valor: "99", texto: "Fincas" });
    expect(payload.hitos).toEqual([{ anio: "", texto: "" }]);
    expect(payload.capitulos[0].bloques).toHaveLength(1);
  });
});
