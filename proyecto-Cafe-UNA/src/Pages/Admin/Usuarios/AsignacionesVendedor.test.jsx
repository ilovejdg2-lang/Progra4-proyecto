import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AsignacionesVendedor } from "./AsignacionesVendedor";
import {
  obtenerAsignacionesPunto,
  obtenerPuntosAsignables,
} from "../../../services/usuariosService";

vi.mock("../../../Components/T/ST", () => ({ ST: ({ children }) => <>{children}</> }));
vi.mock("../../../Components/ui/SelectFiltro", () => ({
  SelectFiltro: ({ children, ...props }) => <select {...props}>{children}</select>,
}));
vi.mock("../../../services/usuariosService", () => ({
  asignarPuntosVendedor: vi.fn(),
  cambiarEstadoAsignacionPunto: vi.fn(),
  cambiarPuntoAsignado: vi.fn(),
  obtenerAsignacionesPunto: vi.fn(),
  obtenerPuntosAsignables: vi.fn(),
}));

function diferido() {
  let resolver;
  const promesa = new Promise((resolve) => {
    resolver = resolve;
  });
  return { promesa, resolver };
}

const asignacion = (id) => ({ id, ubicacionId: id, codigo: `P${id}`, nombre: `Punto ${id}`, asignacionActiva: true });

describe("AsignacionesVendedor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerPuntosAsignables.mockResolvedValue([]);
  });

  it("ignores a stale response after the user changes", async () => {
    const primero = diferido();
    obtenerAsignacionesPunto
      .mockReturnValueOnce(primero.promesa)
      .mockResolvedValueOnce([asignacion(2)]);
    const onChange = vi.fn();

    const { rerender } = render(<AsignacionesVendedor usuarioId={1} onChange={onChange} />);
    rerender(<AsignacionesVendedor usuarioId={2} onChange={onChange} />);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    primero.resolver([asignacion(1)]);
    await Promise.resolve();
    await Promise.resolve();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0].ubicacionId).toBe(2);
  });
});
