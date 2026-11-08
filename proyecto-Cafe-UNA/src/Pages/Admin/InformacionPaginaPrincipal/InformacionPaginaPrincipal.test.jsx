import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { subirImagenInformacion, obtenerProductoresHero } = vi.hoisted(() => ({
  subirImagenInformacion: vi.fn(),
  obtenerProductoresHero: vi.fn(),
}));

vi.mock("../../../services/informacionService", async (importOriginal) => ({
  ...(await importOriginal()),
  subirImagenInformacion,
  obtenerProductoresHero,
}));
vi.mock("../layouts/AdminLayout", () => ({ AdminLayout: ({ children }) => <>{children}</> }));
vi.mock("../../../Components/AdminPageGate/AdminPageGate", () => ({
  AdminPageGate: ({ children }) => <>{children}</>,
}));
vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ id: 1, roles: ["SuperAdmin"] }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
const { PAGE_DATA } = vi.hoisted(() => ({
  PAGE_DATA: {
    hero: { title: "Cafe UNA", subtitle: "Cultivamos futuro", backgroundImage: "https://example.test/hero.png" },
    seccionesInicio: {
      homeSpotlight: { title: "Conozca nuestra historia", image: "https://example.test/s.png" },
      homeFeatured: { title: "", description: "" },
      homeIniciativas: { title: "Iniciativas UNA" },
      homeLocation: { title: "Visitenos" },
      homeFaq: { title: "Dudas" },
      homeDocumentacion: { title: "Documentos" },
    },
    tarjetasInicio: [],
    faqInicio: [{ pregunta: "a" }, { pregunta: "b" }],
    navbar: {},
    footer: { fraseMarca: "Cafe con proposito" },
    enlacesNavbar: [{ id: 1 }, { id: 2 }, { id: 3 }],
    enlacesFooter: [],
  },
}));
const PAGE_RESULT = { status: "ready", reload: () => {}, error: "", data: PAGE_DATA };
vi.mock("../../../hooks/useCachedPageData", () => ({ useCachedPageData: () => PAGE_RESULT }));

import AdminInformacionPaginaPrincipal, { ModalHero, ModalTarjetasInicio } from "./InformacionPaginaPrincipal";

describe("CMS home image integration", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    subirImagenInformacion.mockReset();
  });

  it("saves the uploaded hero URL in the existing hero payload", async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn();
    subirImagenInformacion.mockResolvedValue("/api/informacion/imagenes/hero.webp");
    render(
      <ModalHero
        hero={{ title: "Café UNA", subtitle: "Cultivamos futuro", backgroundImage: "https://example.test/current.png" }}
        onCerrar={vi.fn()}
        onGuardar={onGuardar}
        guardando={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo URL"), {
      target: { files: [new File(["image"], "hero.webp", { type: "image/webp" })] },
    });
    await waitFor(() => expect(subirImagenInformacion).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Imagen de fondo URL" })).toHaveValue("/api/informacion/imagenes/hero.webp"));

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith(expect.objectContaining({ backgroundImage: "/api/informacion/imagenes/hero.webp" })));
  });

  it("renders one editable card per home card key with typed values preserved", async () => {
    const user = userEvent.setup();
    const tarjetas = ["donaciones", "visitas", "voluntariado"].map((clave) => ({ clave, etiqueta: clave, titulo: `Titulo ${clave}` }));
    render(<ModalTarjetasInicio tarjetas={tarjetas} onCerrar={vi.fn()} onGuardar={vi.fn()} guardando={false} />);

    const titulos = screen.getAllByDisplayValue(/^Titulo /);
    expect(titulos).toHaveLength(3);
    await user.type(titulos[1], "!");
    expect(screen.getAllByDisplayValue(/^Titulo /)[1]).toBe(titulos[1]);
    expect(titulos[1]).toHaveValue("Titulo visitas!");
  });
});


describe("Homepage info sections list", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    obtenerProductoresHero.mockResolvedValue(null);
  });

  const nombresFilas = (panel) => within(panel).getAllByRole("button").map((b) => b.getAttribute("aria-label"));

  it("shows tabs with counts and numbers homepage rows in public render order", () => {
    render(<AdminInformacionPaginaPrincipal />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual(["Página de inicio (10)", "Barra de navegación (2)", "Pie de página (2)"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tabs[0].id);
    expect(tabs[0]).toHaveAttribute("aria-controls", panel.id);
    expect(nombresFilas(panel)).toEqual([
      "Editar Portada principal",
      "Editar Sobre nosotros (inicio)",
      "Editar Productos destacados",
      "Editar Iniciativas",
      "Editar Mini formularios",
      "Editar Documentación del proyecto",
      "Editar Portada y mapa de productores",
      "Editar Ubicación",
      "Editar Preguntas frecuentes",
      "Editar Preguntas y respuestas",
    ]);
  });

  it("exposes short mobile labels while keeping the full name accessible", () => {
    render(<AdminInformacionPaginaPrincipal />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.firstElementChild.textContent)).toEqual(["Inicio", "Navegación", "Pie"]);
    expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual(["Página de inicio (10)", "Barra de navegación (2)", "Pie de página (2)"]);
    expect(screen.getByRole("tablist")).toHaveClass("grid-cols-3");
  });

  it("switches the visible rows when another tab is selected", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.click(screen.getByRole("tab", { name: "Barra de navegación (2)" }));

    expect(screen.getByRole("tab", { name: "Barra de navegación (2)" })).toHaveAttribute("aria-selected", "true");
    expect(nombresFilas(screen.getByRole("tabpanel"))).toEqual(["Editar Barra de navegación", "Editar Menú de navegación"]);
    expect(screen.queryByRole("button", { name: "Editar Portada principal" })).not.toBeInTheDocument();
  });

  it("moves between tabs with the arrow, Home and End keys", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    screen.getAllByRole("tab")[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("tab")[1]).toHaveFocus();
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getAllByRole("tab")[2]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("tab")[0]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getAllByRole("tab")[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getAllByRole("tab")[0]).toHaveFocus();
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("shows saved content previews and the empty hint", () => {
    render(<AdminInformacionPaginaPrincipal />);

    expect(screen.getByText("Cafe UNA")).toBeInTheDocument();
    expect(screen.getByText("Conozca nuestra historia")).toBeInTheDocument();
    expect(screen.getByText("2 preguntas")).toBeInTheDocument();
    expect(screen.getAllByText("Sin contenido").length).toBeGreaterThan(0);
  });

  it("opens the matching modal when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.click(screen.getByRole("button", { name: "Editar Portada principal" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("filters rows with the search box, updates tab counts and jumps to the first tab with matches", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.type(screen.getByRole("searchbox"), "Menú de navegación");

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual(["Página de inicio (0)", "Barra de navegación (1)", "Pie de página (0)"]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Editar Menú de navegación" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Portada principal" })).not.toBeInTheDocument();
  });

  it("disables tabs without matches while searching: not clickable and skipped by keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    // "Pie de página" and "Menú de navegación" live in different tabs; "Navbar" -> navbar tab only.
    await user.type(screen.getByRole("searchbox"), "Menú de navegación");
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("aria-disabled"))).toEqual(["true", null, "true"]);

    await user.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    tabs[1].focus();
    for (const key of ["{ArrowRight}", "{ArrowLeft}", "{Home}", "{End}"]) {
      await user.keyboard(key);
      expect(tabs[1]).toHaveFocus();
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    }
  });

  it("keeps End on the last enabled tab while searching", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.type(screen.getByRole("searchbox"), "navegación");
    const tabs = screen.getAllByRole("tab");
    const enabled = tabs.filter((tab) => tab.getAttribute("aria-disabled") !== "true");
    expect(enabled.length).toBeGreaterThanOrEqual(1);
    expect(tabs.some((tab) => tab.getAttribute("aria-disabled") === "true")).toBe(true);

    enabled[0].focus();
    await user.keyboard("{End}");
    expect(enabled[enabled.length - 1]).toHaveFocus();
  });

  it("does not match the empty-section placeholder text when searching", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.type(screen.getByRole("searchbox"), "guardado");

    expect(screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-label"))).toEqual(["Página de inicio (0)", "Barra de navegación (0)", "Pie de página (0)"]);
  });

  it("leaves every tab enabled when the search is empty", () => {
    render(<AdminInformacionPaginaPrincipal />);
    screen.getAllByRole("tab").forEach((tab) => expect(tab).not.toHaveAttribute("aria-disabled", "true"));
  });

  it("restores the full counts when the search is cleared", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.type(screen.getByRole("searchbox"), "Menú de navegación");
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-label"))).toEqual(["Página de inicio (10)", "Barra de navegación (2)", "Pie de página (2)"]);
  });
});

describe("Homepage info edit modals", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    obtenerProductoresHero.mockResolvedValue(null);
  });

  it("renders the close button in the header and closes the modal", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.click(screen.getByRole("button", { name: "Editar Portada principal" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { level: 2, name: "Portada principal" })).toBeInTheDocument();

    const header = dialog.querySelector("header");
    const cerrar = within(dialog).getByRole("button", { name: "Cerrar" });
    expect(header).toContainElement(cerrar);
    expect(header.querySelector("h2")).not.toContainElement(cerrar);

    await user.click(cerrar);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("puts Cancelar before Guardar cambios in the footer", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.click(screen.getByRole("button", { name: "Editar Portada principal" }));
    const dialog = await screen.findByRole("dialog");
    const cancelar = within(dialog).getByRole("button", { name: "Cancelar" });
    const guardar = within(dialog).getByRole("button", { name: "Guardar cambios" });

    expect(cancelar.compareDocumentPosition(guardar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the image URL input behind the Usar URL disclosure", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.click(screen.getByRole("button", { name: "Editar Portada principal" }));
    const dialog = await screen.findByRole("dialog");

    const resumen = within(dialog).getByText("Usar URL");
    expect(resumen.closest("details")).not.toHaveAttribute("open");
    await user.click(resumen);
    expect(within(dialog).getByRole("textbox", { name: "Imagen de fondo URL" })).toHaveValue("https://example.test/hero.png");
    expect(within(dialog).getByRole("button", { name: "Reemplazar" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Quitar" })).toBeInTheDocument();
  });

  it("flags the word counter near and at the limit", async () => {
    const user = userEvent.setup();
    render(<ModalHero hero={{ title: "" }} onCerrar={vi.fn()} onGuardar={vi.fn()} guardando={false} />);
    const titulo = screen.getByRole("textbox", { name: "Título principal" });

    expect(screen.getAllByText("0/15 palabras")).toHaveLength(1);
    await user.type(titulo, "a b c d e f g h i j k l m");
    expect(screen.getByText("13/15 palabras")).toHaveAttribute("data-estado", "normal");
    await user.type(titulo, " n");
    expect(screen.getByText("14/15 palabras")).toHaveAttribute("data-estado", "cerca");
    await user.type(titulo, " o");
    expect(screen.getByText("15/15 palabras")).toHaveAttribute("data-estado", "limite");
  });
});
