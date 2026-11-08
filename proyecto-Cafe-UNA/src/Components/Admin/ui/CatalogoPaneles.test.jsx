import { render, screen } from "@testing-library/react";
import { beforeEach, describe, it, vi } from "vitest";

import { expectApprovedModalAnatomy } from "../../../test/modalAnatomy";

vi.mock("../../../services/categoriasService", () => ({
  actualizarCategoria: vi.fn(),
  crearCategoria: vi.fn(),
  eliminarCategoria: vi.fn(),
  obtenerCategorias: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../../services/catalogosService", () => ({
  actualizarItemCatalogo: vi.fn(),
  crearItemCatalogo: vi.fn(),
  eliminarItemCatalogo: vi.fn(),
  listarCatalogo: vi.fn().mockResolvedValue([]),
  TIPOS_CATALOGO: {},
}));

import { ModalCatalogo } from "./CatalogoPaneles";

describe("ModalCatalogo", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
  });

  it("follows the approved modal anatomy (header close, no form footer)", async () => {
    const onClose = vi.fn();
    render(<ModalCatalogo open onClose={onClose} titulo="Categorías" tipo="categorias" />);

    const dialog = screen.getByRole("dialog", { name: "Categorías" });
    await expectApprovedModalAnatomy(dialog, { onClose });
  });
});
