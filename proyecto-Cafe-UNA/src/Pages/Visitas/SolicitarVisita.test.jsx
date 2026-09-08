import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const crearSolicitudVisitaMock = vi.fn();
const obtenerDisponibilidadMock = vi.fn();

vi.mock("../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ id: 7, email: "test@ejemplo.com", roles: ["Cliente"] }),
}));
vi.mock("../../services/visitasService", () => ({
  crearSolicitudVisita: (...args) => crearSolicitudVisitaMock(...args),
  obtenerDisponibilidadVisitasPublica: (...args) => obtenerDisponibilidadMock(...args),
}));

import SolicitarVisita from "./SolicitarVisita";

describe("SolicitarVisita", () => {
  beforeEach(() => {
    crearSolicitudVisitaMock.mockReset();
    obtenerDisponibilidadMock.mockReset().mockResolvedValue([
      {
        id: "12",
        fecha: "2099-12-31",
        horaInicio: "09:00:00",
        horaFin: "10:00:00",
        habilitada: true,
        nota: "Llegar 10 minutos antes",
      },
    ]);
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
    fireEvent.change(await screen.findByLabelText(/fecha y horario disponibles/i), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByLabelText(/motivo de la visita/i), { target: { value: "Académica" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(crearSolicitudVisitaMock).toHaveBeenCalledTimes(1));
    expect(crearSolicitudVisitaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        encargadoNombre: "Ana López",
        cantidadVisitantes: "4",
        disponibilidadVisitaId: "12",
      }),
    );
    expect(await screen.findByText(/solicitud #31/i)).toBeInTheDocument();
  });

  it("offers only API-provided slots and removes the obsolete guide request", async () => {
    render(<SolicitarVisita />);

    expect(await screen.findByRole("option", { name: /31 de diciembre de 2099.*09:00.*10:00/i })).toHaveValue("12");
    fireEvent.change(screen.getByLabelText(/fecha y horario disponibles/i), {
      target: { value: "12" },
    });
    expect(screen.queryByLabelText(/guía/i)).not.toBeInTheDocument();
    expect(screen.getByText(/vestimenta cómoda/i)).toBeInTheDocument();
    expect(screen.getByText(/repelente/i)).toBeInTheDocument();
    expect(screen.getByText(/protección solar/i)).toBeInTheDocument();
    expect(screen.getByText(/llegar 10 minutos antes/i)).toBeInTheDocument();
  });

  it("prevents submission when no visit slots are available", async () => {
    obtenerDisponibilidadMock.mockResolvedValueOnce([]);
    render(<SolicitarVisita />);

    expect(await screen.findByText(/no hay fechas y horarios habilitados/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar solicitud/i })).toBeDisabled();
  });
});
