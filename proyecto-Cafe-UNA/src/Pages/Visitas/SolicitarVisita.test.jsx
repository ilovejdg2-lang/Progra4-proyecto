import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const crearSolicitudVisitaMock = vi.fn();

vi.mock("../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ id: 7, email: "test@ejemplo.com", roles: ["Cliente"] }),
}));
vi.mock("../../services/visitasService", () => ({
  crearSolicitudVisita: (...args) => crearSolicitudVisitaMock(...args),
}));

import SolicitarVisita from "./SolicitarVisita";

describe("SolicitarVisita", () => {
  beforeEach(() => {
    crearSolicitudVisitaMock.mockReset();
  });

  it("shows validation instead of sending an incomplete group request", async () => {
    render(<SolicitarVisita />);

    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/completá los campos obligatorios/i);
    expect(crearSolicitudVisitaMock).not.toHaveBeenCalled();
  });

  it("submits the backend-compatible visit payload", async () => {
    crearSolicitudVisitaMock.mockResolvedValueOnce({ id: "31", estado: "Pendiente" });
    render(<SolicitarVisita />);

    fireEvent.change(screen.getByLabelText(/nombre del encargado/i), { target: { value: "Ana López" } });
    fireEvent.change(screen.getByLabelText(/identificación/i), { target: { value: "1-1111-1111" } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: "ana@ejemplo.com" } });
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: "8888-7777" } });
    fireEvent.change(screen.getByLabelText(/provincia o ciudad/i), { target: { value: "Heredia" } });
    fireEvent.change(screen.getByLabelText(/cantidad de visitantes/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/tipo de grupo/i), { target: { value: "Universidad" } });
    fireEvent.change(screen.getByLabelText(/fecha de visita/i), { target: { value: "2099-12-31" } });
    fireEvent.change(screen.getByLabelText(/hora preferida/i), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText(/motivo de la visita/i), { target: { value: "Académica" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(crearSolicitudVisitaMock).toHaveBeenCalledTimes(1));
    expect(crearSolicitudVisitaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        encargadoNombre: "Ana López",
        cantidadVisitantes: "4",
        fechaVisita: "2099-12-31",
        requiereGuia: false,
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/solicitud #31/i);
  });
});
