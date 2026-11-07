import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminUsuarios from "./Usuarios";
import { obtenerUsuarios } from "../../../services/usuariosService";

vi.mock("../layouts/AdminLayout", () => ({ AdminLayout: ({ children }) => <>{children}</> }));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ children }) => <>{children}</>,
}));
vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("../../../Components/T/ST", () => ({ ST: ({ children }) => <>{children}</> }));
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ id: 1, roles: ["SuperAdmin"] }),
}));
vi.mock("../../../services/cedulaService", () => ({ consultarCedulaDetallada: vi.fn() }));
vi.mock("../../../services/usuariosService", () => ({
  obtenerUsuarios: vi.fn(),
  obtenerAsignacionesPunto: vi.fn(),
  actualizarUsuario: vi.fn(),
  cambiarEstadoUsuario: vi.fn(),
  solicitarCreacionUsuario: vi.fn(),
  confirmarCreacionUsuario: vi.fn(),
  solicitarCambioCorreoUsuario: vi.fn(),
  confirmarCambioCorreoUsuario: vi.fn(),
}));

const CORREO_LARGO =
  "maria.de.los.angeles.fernandez.rodriguez.de.la.cruz@cooperativa-cafetalera-ejemplo.example.test";

const usuarios = [
  { id: 1, nombre: "Zeta Admin", correo: "alfa@example.test", estado: "Activo", roles: ["SuperAdmin"] },
  { id: 2, nombre: "Ana Vendedora", correo: "zulu@example.test", estado: "Inactivo", roles: ["Vendedor"], puntosVentaActivos: 0 },
  { id: 3, nombre: "Beto Sin Roles", correo: CORREO_LARGO, estado: "Activo", roles: [] },
];

function filas() {
  return screen.getAllByRole("row").slice(1);
}

function correosEnOrden() {
  return filas().map((fila) => within(fila).getByText(/@/).textContent);
}

describe("Usuarios table", () => {
  beforeEach(async () => {
    obtenerUsuarios.mockResolvedValue(usuarios);
    render(<AdminUsuarios />);
    await screen.findByRole("table");
  });

  it("sorts by name from the Usuario header", async () => {
    await userEvent.click(screen.getByRole("button", { name: /Usuario/ }));

    // The name is the first element with a title in each identity cell.
    const nombres = filas().map((fila) => fila.querySelector("[title]").getAttribute("title"));
    expect(nombres).toEqual(["Ana Vendedora", "Beto Sin Roles", "Zeta Admin"]);
  });

  it("sorts by email from the Correo header, ascending then descending", async () => {
    const boton = screen.getByRole("button", { name: /Correo/ });

    await userEvent.click(boton);
    expect(correosEnOrden()).toEqual(["alfa@example.test", CORREO_LARGO, "zulu@example.test"]);

    await userEvent.click(boton);
    expect(correosEnOrden()).toEqual(["zulu@example.test", CORREO_LARGO, "alfa@example.test"]);
  });
});
