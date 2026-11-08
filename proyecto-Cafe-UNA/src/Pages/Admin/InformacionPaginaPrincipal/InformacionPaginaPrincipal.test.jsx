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

  it("groups rows under headings and numbers homepage rows in public render order", () => {
    render(<AdminInformacionPaginaPrincipal />);

    const titulos = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titulos).toEqual(["Página de inicio", "Barra de navegación", "Pie de página"]);

    const inicio = screen.getByRole("heading", { name: "Página de inicio" }).closest("section");
    const nombres = within(inicio).getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(nombres).toEqual([
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

  it("shows saved content previews and the empty hint", () => {
    render(<AdminInformacionPaginaPrincipal />);

    expect(screen.getByText("Cafe UNA")).toBeInTheDocument();
    expect(screen.getByText("Conozca nuestra historia")).toBeInTheDocument();
    expect(screen.getByText("2 preguntas")).toBeInTheDocument();
    expect(screen.getByText("3 enlaces")).toBeInTheDocument();
    expect(screen.getByText("Cafe con proposito")).toBeInTheDocument();
    expect(screen.getAllByText("Sin contenido").length).toBeGreaterThan(0);
  });

  it("opens the matching modal when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.click(screen.getByRole("button", { name: "Editar Portada principal" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("filters rows with the search box and hides empty groups", async () => {
    const user = userEvent.setup();
    render(<AdminInformacionPaginaPrincipal />);

    await user.type(screen.getByRole("searchbox"), "Menú de navegación");

    expect(screen.getByRole("button", { name: "Editar Menú de navegación" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Portada principal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Página de inicio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pie de página" })).not.toBeInTheDocument();
  });
});
