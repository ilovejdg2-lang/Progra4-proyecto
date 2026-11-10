import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerNecesidadesMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, className }) => (
    <a href={params ? to.replace("$necesidadId", params.necesidadId) : to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("../../services/donacionesService", () => ({
  obtenerNecesidadesPublicas: (...args) => obtenerNecesidadesMock(...args),
}));

import NecesidadesDonacion from "./NecesidadesDonacion";

const NECESIDADES = [
  {
    id: 1,
    estado: "ACTIVA",
    prioridad: "ALTA",
    titulo: "Herramientas de campo",
    descripcion: "Para el mantenimiento de los cafetales.",
    materiales: [
      { id: 1, nombre: "Palas", estado: "ACTIVA" },
      { id: 2, nombre: "Machetes", estado: "ACTIVA" },
      { id: 3, nombre: "Tijeras", estado: "INACTIVA" },
    ],
  },
  { id: 2, estado: "ACTIVA", prioridad: "BAJA", titulo: "Papelería", materiales: [] },
  { id: 3, estado: "INACTIVA", prioridad: "MEDIA", titulo: "Oculta", materiales: [] },
];

describe("NecesidadesDonacion", () => {
  beforeEach(() => {
    obtenerNecesidadesMock.mockReset().mockResolvedValue(NECESIDADES);
  });

  it("shows the page header with the action to donate another material", async () => {
    render(<NecesidadesDonacion />);

    expect(await screen.findByRole("heading", { level: 1, name: /lo que necesitamos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /donar otro material/i })).toHaveAttribute(
      "href",
      "/donaciones/solicitar",
    );
  });

  it("lists only active needs with the priority in words and the accepted materials", async () => {
    render(<NecesidadesDonacion />);

    expect(await screen.findByText("Herramientas de campo")).toBeInTheDocument();
    expect(screen.queryByText("Oculta")).not.toBeInTheDocument();
    expect(screen.getByText(/prioridad alta/i)).toBeInTheDocument();
    expect(screen.getByText(/prioridad baja/i)).toBeInTheDocument();
    expect(screen.getByText(/palas, machetes/i)).toBeInTheDocument();
    expect(screen.queryByText(/tijeras/i)).not.toBeInTheDocument();
  });

  it("links each row to the donation route of that need", async () => {
    render(<NecesidadesDonacion />);

    const enlace = await screen.findByRole("link", { name: /quiero donar.*herramientas de campo/i });
    expect(enlace).toHaveAttribute("href", "/donaciones/necesidades/1/donar");
  });

  it("explains an empty list", async () => {
    obtenerNecesidadesMock.mockResolvedValue([]);
    render(<NecesidadesDonacion />);

    expect(await screen.findByText(/por ahora no hay necesidades activas/i)).toBeInTheDocument();
  });

  it("shows the error with a retry that loads the list again", async () => {
    obtenerNecesidadesMock.mockRejectedValueOnce(new Error("Sin conexión"));
    render(<NecesidadesDonacion />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/sin conexión/i);
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(await screen.findByText("Herramientas de campo")).toBeInTheDocument();
    expect(obtenerNecesidadesMock).toHaveBeenCalledTimes(2);
  });
});
