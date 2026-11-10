import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerDocumentosPublicos = vi.fn();
const registrarVistaDocumento = vi.fn(() => Promise.resolve());
const descargarArchivo = vi.fn(() => Promise.resolve());

vi.mock("../../services/documentosService", () => ({
  obtenerDocumentosPublicos: (...args) => obtenerDocumentosPublicos(...args),
  registrarVistaDocumento: (...args) => registrarVistaDocumento(...args),
  descargarArchivo: (...args) => descargarArchivo(...args),
  obtenerCategoriasDocumentos: () => Promise.resolve([]),
  obtenerUrlVisualizarDocumento: (id) => `/visor/${id}`,
  solicitarAccesoDocumento: vi.fn(),
}));
vi.mock("../../services/sessionService", () => ({ getActiveSessionUser: () => null }));
vi.mock("../../hooks/usePublicPageLoadingGate", () => ({ usePublicPageLoadingGate: () => false }));
vi.mock("../../Components/BackToHomeLink/BackToHomeLink", () => ({ default: () => null }));

import Repositorio from "./Repositorio";

const docs = [
  { id: "1", titulo: "Guía de poda", autor: "Ana Mora", categoria: "Guías", anio: 2025, descargasCount: 3, nombreOriginal: "poda.pdf" },
  { id: "2", titulo: "Tesis de suelos", categoria: "Investigaciones", anio: 2024, descargasCount: 0, nombreOriginal: "suelos.docx", esPrivado: true },
];

function respuesta(items = docs, extra = {}) {
  return {
    items,
    total: items.length,
    totalPaginas: 1,
    facetas: { categorias: [{ nombre: "Guías", count: 1 }, { nombre: "Investigaciones", count: 1 }, { nombre: "Vacía", count: 0 }] },
    ...extra,
  };
}

describe("Repositorio page", () => {
  beforeEach(() => {
    obtenerDocumentosPublicos.mockReset();
    obtenerDocumentosPublicos.mockResolvedValue(respuesta());
    registrarVistaDocumento.mockClear();
    window.history.replaceState(null, "", "/repositorio");
  });

  it("lists documents with meta line, icon download and only non-empty categories", async () => {
    render(<Repositorio />);

    expect(await screen.findByRole("button", { name: "Guía de poda" })).toBeInTheDocument();
    expect(screen.getByText("Ana Mora · Guías · 2025 · 3 descargas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar Guía de poda" })).toBeInTheDocument();
    expect(document.querySelector(".repo-count")).toHaveTextContent("2 documentos");

    const categorias = screen.getByRole("navigation", { name: "Categorías" });
    expect(within(categorias).getByRole("button", { name: /Guías/ })).toHaveAttribute("aria-pressed", "false");
    expect(within(categorias).queryByRole("button", { name: /Vacía/ })).toBeNull();
    expect(within(categorias).getByRole("button", { name: /Todas/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("filters by category and updates the URL", async () => {
    const user = userEvent.setup();
    render(<Repositorio />);
    await screen.findByRole("button", { name: "Guía de poda" });

    const categorias = screen.getByRole("navigation", { name: "Categorías" });
    await user.click(within(categorias).getByRole("button", { name: /Guías/ }));

    await waitFor(() =>
      expect(obtenerDocumentosPublicos).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoria: "Guías", pagina: 1, limite: 12 }),
      ),
    );
    expect(window.location.search).toContain("categoria=");
  });

  it("sends the backend orden value when choosing Más descargados", async () => {
    const user = userEvent.setup();
    render(<Repositorio />);
    await screen.findByRole("button", { name: "Guía de poda" });

    await user.click(screen.getByRole("radio", { name: "Más descargados" }));

    await waitFor(() =>
      expect(obtenerDocumentosPublicos).toHaveBeenLastCalledWith(expect.objectContaining({ orden: "descargas" })),
    );
    expect(window.location.search).toContain("orden=descargas");
  });

  it("counts a view when the viewer opens", async () => {
    const user = userEvent.setup();
    render(<Repositorio />);

    await user.click(await screen.findByRole("button", { name: "Guía de poda" }));

    expect(registrarVistaDocumento).toHaveBeenCalledWith("1");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("opens the viewer from the ?docId= deep link", async () => {
    window.history.replaceState(null, "", "/repositorio?docId=2");
    render(<Repositorio />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(registrarVistaDocumento).toHaveBeenCalledWith("2");
  });

  it("shows the empty state with a way to clear the search", async () => {
    obtenerDocumentosPublicos.mockResolvedValue(respuesta([]));
    window.history.replaceState(null, "", "/repositorio?buscar=nada");
    render(<Repositorio />);

    expect(await screen.findByText("No encontramos documentos con esa búsqueda.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar búsqueda" })).toBeInTheDocument();
  });

  it("shows a retryable error banner", async () => {
    const user = userEvent.setup();
    obtenerDocumentosPublicos.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Repositorio />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar los documentos");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("button", { name: "Guía de poda" })).toBeInTheDocument();
  });

  it("opens the access-request modal when downloading a private document as a visitor", async () => {
    const user = userEvent.setup();
    render(<Repositorio />);

    await user.click(await screen.findByRole("button", { name: "Descargar Tesis de suelos" }));

    expect(descargarArchivo).not.toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "Solicitar acceso" })).toBeInTheDocument();
  });
});
