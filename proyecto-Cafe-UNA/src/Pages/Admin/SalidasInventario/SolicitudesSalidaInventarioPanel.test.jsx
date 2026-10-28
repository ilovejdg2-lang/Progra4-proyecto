import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SolicitudesSalidaInventarioPanel } from "./SolicitudesSalidaInventarioPanel";

const mocks = vi.hoisted(() => ({
  crearSolicitud: vi.fn(),
  obtenerSolicitudes: vi.fn(),
  revisarSolicitud: vi.fn(),
}));

vi.mock("../../../services/inventarioSalidasService", () => ({
  crearSolicitudSalidaInventario: mocks.crearSolicitud,
  obtenerSolicitudesSalidaInventario: mocks.obtenerSolicitudes,
  revisarSolicitudSalidaInventario: mocks.revisarSolicitud,
}));

describe("SolicitudesSalidaInventarioPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerSolicitudes.mockResolvedValue([]);
    mocks.crearSolicitud.mockResolvedValue({ Id: "55", Estado: "pendiente" });
    mocks.revisarSolicitud.mockResolvedValue({ Id: "55", Estado: "aprobada" });
  });

  it("creates a multi-item request and does not debit inventory immediately", async () => {
    const user = userEvent.setup();
    const onInventoryChanged = vi.fn();
    render(
      <SolicitudesSalidaInventarioPanel
        productos={[{ id: "101", nombre: "Café de altura", stock: 8 }]}
        puedeSolicitar
        esSuperAdmin={false}
        onInventoryChanged={onInventoryChanged}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Tipo de salida" }), "regalia");
    await user.type(screen.getByRole("textbox", { name: "Destinatario" }), "Biblioteca UNA");
    await user.type(screen.getByRole("textbox", { name: "Responsable" }), "Luis Mora");
    const row = screen.getByRole("group", { name: "Artículo 1" });
    await user.selectOptions(within(row).getByRole("combobox", { name: "Producto" }), "101");
    await user.type(within(row).getByRole("spinbutton", { name: "Cantidad" }), "2");
    await user.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() => expect(mocks.crearSolicitud).toHaveBeenCalledWith(expect.objectContaining({
      tipo: "regalia",
      destinatario: "Biblioteca UNA",
      responsable: "Luis Mora",
      items: [{ productoId: "101", cantidad: 2 }],
    })));
    expect(await screen.findByText(/pendiente de revisión/i)).toBeInTheDocument();
    expect(mocks.revisarSolicitud).not.toHaveBeenCalled();
    expect(onInventoryChanged).toHaveBeenCalledOnce();
  });

  it("lets only a SuperAdmin review pending requests and requires a reason for rejection", async () => {
    const user = userEvent.setup();
    const onInventoryChanged = vi.fn();
    mocks.obtenerSolicitudes.mockResolvedValue([{
      Id: "55",
      Estado: "pendiente",
      Tipo: "donacion",
      Destinatario: "Fundación Café UNA",
      ResponsableNombre: "Ana Solís",
      FechaSalida: "2026-10-27",
      Items: [{ ProductoId: "101", Cantidad: 2, Producto: { Nombre: "Café de altura" } }],
      Historial: [{ Accion: "solicitada", ActorId: 9, CreadaEn: "2026-10-26T10:00:00Z" }],
    }]);
    render(<SolicitudesSalidaInventarioPanel productos={[]} puedeSolicitar={false} esSuperAdmin onInventoryChanged={onInventoryChanged} />);

    expect(await screen.findByText(/Fundación Café UNA/)).toBeInTheDocument();
    expect(document.getElementById("solicitud-55")).toBeInTheDocument();
    expect(screen.getByText(/solicitada.*9/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/comentario/i);
    expect(mocks.revisarSolicitud).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: "Comentario de revisión" }), "Falta autorización formal");
    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    await waitFor(() => expect(mocks.revisarSolicitud).toHaveBeenCalledWith("55", "rechazar", "Falta autorización formal"));
    expect(onInventoryChanged).toHaveBeenCalledOnce();
  });
});
