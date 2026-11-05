import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const serviceMocks = vi.hoisted(() => ({
  obtenerSolicitudes: vi.fn(),
  actualizarSolicitud: vi.fn(),
  eliminarSolicitud: vi.fn(),
  descargarDocumentoIntegrantes: vi.fn(),
}));

vi.mock("../../../services/voluntariadoService", () => serviceMocks);
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ id: 1, roles: ["SuperAdmin"] }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouterState: () => ({}),
}));
vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ children }) => <>{children}</>,
}));
vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("./GestionFechasVoluntariado", () => ({ GestionFechasVoluntariado: () => null }));

import AdminVoluntariado from "./Voluntariado";

async function renderPage() {
  serviceMocks.obtenerSolicitudes.mockResolvedValue([
    {
      id: 5,
      nombre: "Ana Mora",
      email: "ana@example.com",
      telefono: "88888888",
      identificacion: "101110111",
      tipoVoluntariado: "Individual",
      fechaSolicitud: "2026-09-01",
      estado: "Pendiente",
    },
  ]);
  render(<AdminVoluntariado />);
  await screen.findAllByText("Ana Mora");
}

describe.each([
  ["Ver solicitud", "Ver solicitud"],
  ["Editar solicitud", "Editar solicitud"],
])("Voluntariado %s modal", (title, heading) => {
  beforeEach(() => vi.clearAllMocks());

  it("is a native modal dialog that closes on Escape", async () => {
    await renderPage();
    await userEvent.click(screen.getAllByTitle(title)[0]);

    const dialog = document.querySelector("dialog[open]");
    expect(dialog).not.toBeNull();
    expect(dialog.querySelector("h2").textContent).toContain(heading);

    fireEvent.keyDown(within(dialog).getByRole("button", { name: "Cerrar", hidden: true }), { key: "Escape" });
    await waitFor(() => expect(document.querySelector("dialog")).toBeNull());
  });

  it("closes when the scrim is pressed but not on an inner click", async () => {
    await renderPage();
    await userEvent.click(screen.getAllByTitle(title)[0]);
    const dialog = document.querySelector("dialog[open]");

    fireEvent.pointerDown(dialog.querySelector("h2"));
    fireEvent.click(dialog.querySelector("h2"));
    expect(document.querySelector("dialog")).not.toBeNull();

    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    await waitFor(() => expect(document.querySelector("dialog")).toBeNull());
  });
});
