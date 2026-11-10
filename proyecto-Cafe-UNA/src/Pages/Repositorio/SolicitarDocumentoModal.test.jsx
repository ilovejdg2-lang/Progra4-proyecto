import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const solicitarAccesoDocumento = vi.fn(() => Promise.resolve({}));

vi.mock("../../services/documentosService", () => ({
  obtenerCategoriasDocumentos: () =>
    Promise.resolve([
      { id: "1", nombre: "Investigaciones", padre: "", audiencia: "publica" },
      { id: "2", nombre: "Hija", padre: "Investigaciones", audiencia: "publica" },
      { id: "3", nombre: "Interna", padre: "", audiencia: "administrativa" },
    ]),
  solicitarAccesoDocumento: (...args) => solicitarAccesoDocumento(...args),
}));
vi.mock("../../services/sessionService", () => ({ getActiveSessionUser: () => null }));

import { SolicitarDocumentoModal } from "./SolicitarDocumentoModal";

describe("SolicitarDocumentoModal", () => {
  beforeEach(() => solicitarAccesoDocumento.mockClear());

  it("contribution mode: only public root topics, no version or subcategory fields", async () => {
    render(<SolicitarDocumentoModal onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: "Enviar un documento" })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Investigaciones" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Hija" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Interna" })).toBeNull();
    expect(screen.queryByLabelText(/versión/i)).toBeNull();
    expect(screen.queryByLabelText(/subcategoría/i)).toBeNull();
    expect(screen.getByText(/Privado mientras se revisa/)).toBeInTheDocument();
  });

  it("contribution mode: validates before sending and submits the expected FormData", async () => {
    const user = userEvent.setup();
    const { container } = render(<SolicitarDocumentoModal onClose={() => {}} />);
    await screen.findByRole("option", { name: "Investigaciones" });

    await user.click(screen.getByRole("button", { name: "Enviar documento" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("título");
    expect(solicitarAccesoDocumento).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/Título o tema/), "Guía de poda");
    await user.selectOptions(screen.getByLabelText(/Tema/), "Investigaciones");
    await user.upload(container.ownerDocument.querySelector("#sol-doc-archivo"), new File(["x"], "poda.pdf", { type: "application/pdf" }));
    await user.type(screen.getByLabelText(/Nombre completo/), "Ana Mora");
    await user.type(screen.getByLabelText(/Correo electrónico/), "ana@una.cr");
    await user.click(screen.getByRole("button", { name: "Enviar documento" }));

    await waitFor(() => expect(solicitarAccesoDocumento).toHaveBeenCalledTimes(1));
    const fd = solicitarAccesoDocumento.mock.calls[0][0];
    expect(fd.get("documentoTitulo")).toBe("Guía de poda");
    expect(fd.get("categoria")).toBe("Investigaciones");
    expect(fd.get("motivo")).toBe("Envío de documento: Guía de poda");
    expect(fd.get("esPrivado")).toBe("true");
    expect(fd.get("archivo").name).toBe("poda.pdf");
    expect(await screen.findByText("Documento enviado")).toBeInTheDocument();
  });

  it("access-request mode: asks for the reason and sends it as motivo", async () => {
    const user = userEvent.setup();
    render(
      <SolicitarDocumentoModal documento={{ id: "9", titulo: "Tesis privada", categoria: "Investigaciones" }} onClose={() => {}} />,
    );

    expect(screen.getByRole("heading", { name: "Solicitar acceso" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Título o tema/)).toBeDisabled();
    expect(screen.queryByLabelText(/^Tema/)).toBeNull();
    expect(screen.queryByText(/Visibilidad y custodia/)).toBeNull();

    await user.type(screen.getByLabelText(/Nombre completo/), "Ana Mora");
    await user.type(screen.getByLabelText(/Correo electrónico/), "ana@una.cr");
    await user.click(screen.getByRole("button", { name: "Enviar solicitud" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("para qué");

    await user.type(screen.getByLabelText(/¿Para qué lo necesitás?/), "Estudio de suelos");
    await user.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    await waitFor(() => expect(solicitarAccesoDocumento).toHaveBeenCalledTimes(1));
    const fd = solicitarAccesoDocumento.mock.calls[0][0];
    expect(fd.get("documentoId")).toBe("9");
    expect(fd.get("motivo")).toBe("Estudio de suelos");
  });

  it("focuses the first field on open and marks the first invalid field on error", async () => {
    const user = userEvent.setup();
    render(<SolicitarDocumentoModal onClose={() => {}} />);

    expect(screen.getByLabelText(/Título o tema/)).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Enviar documento" }));
    const titulo = screen.getByLabelText(/Título o tema/);
    expect(titulo).toHaveAttribute("aria-invalid", "true");
    expect(titulo).toHaveAttribute("aria-describedby", "sol-error");
    expect(titulo).toHaveFocus();
  });

  it("rejects a dropped file with a disallowed extension", async () => {
    const { container } = render(<SolicitarDocumentoModal onClose={() => {}} />);
    const zona = container.ownerDocument.querySelector("#sol-doc-dropzone");
    const archivo = new File(["x"], "virus.exe");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.drop(zona, { dataTransfer: { files: [archivo] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("tipo de archivo");
    expect(zona).toHaveAttribute("aria-invalid", "true");
  });

  it("moves focus to the success heading after sending", async () => {
    const user = userEvent.setup();
    const { container } = render(<SolicitarDocumentoModal onClose={() => {}} />);
    await screen.findByRole("option", { name: "Investigaciones" });
    await user.type(screen.getByLabelText(/Título o tema/), "Guía");
    await user.selectOptions(screen.getByLabelText(/Tema/), "Investigaciones");
    await user.upload(container.ownerDocument.querySelector("#sol-doc-archivo"), new File(["x"], "a.pdf"));
    await user.type(screen.getByLabelText(/Nombre completo/), "Ana");
    await user.type(screen.getByLabelText(/Correo electrónico/), "ana@una.cr");
    await user.click(screen.getByRole("button", { name: "Enviar documento" }));

    expect(await screen.findByRole("heading", { name: "Documento enviado" })).toHaveFocus();
  });
});
