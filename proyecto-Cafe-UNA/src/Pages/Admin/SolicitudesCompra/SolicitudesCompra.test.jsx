import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const crearSolicitudMock = vi.fn();

vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({ showLoading: false, loadingMessage: "" }),
}));
vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ role: "admin", roles: ["Admin"] }),
}));
vi.mock("../../../services/productosService", () => ({
  obtenerCatalogoProductos: vi.fn().mockResolvedValue([{ id: "p-1", nombre: "Cafe molido", estado: "Activo" }]),
}));
vi.mock("../../../services/solicitudesCompraService", () => ({
  cambiarEstadoSolicitudCompra: vi.fn(),
  crearProveedor: vi.fn(),
  crearSolicitudCompra: (...args) => crearSolicitudMock(...args),
  descargarProformaAutenticada: vi.fn(),
  obtenerProveedores: vi.fn().mockResolvedValue([{ id: "v-1", nombre: "Proveedor Uno" }]),
  obtenerSolicitudCompra: vi.fn(),
  obtenerSolicitudesCompra: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../../Components/ui/SelectFiltro", () => ({
  SelectFiltro: ({ name, value, onChange, children }) => (
    <select name={name} value={value} onChange={onChange}>
      {children}
    </select>
  ),
}));
vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

import AdminSolicitudesCompra from "./SolicitudesCompra";

const abrirFormulario = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /Nueva solicitud/ }));
  return screen.findByRole("dialog", { name: /Nueva solicitud de compra/ });
};

describe("SolicitudesCompra form", () => {
  beforeEach(() => crearSolicitudMock.mockReset());

  it("starts blank every time it is reopened", async () => {
    const { container } = render(<AdminSolicitudesCompra />);
    let dialog = await abrirFormulario();

    fireEvent.click(within(dialog).getByRole("button", { name: "Crear solicitud" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Seleccioná un proveedor.");

    fireEvent.change(dialog.querySelector("[name='proveedorId']"), { target: { value: "v-1" } });
    fireEvent.change(dialog.querySelector("[name='productoId']"), { target: { value: "p-1" } });
    fireEvent.change(dialog.querySelector("[name='cantidad']"), { target: { value: "5" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /Notas/ }), { target: { value: "urgente" } });
    const pdf = new File(["x"], "proforma.pdf", { type: "application/pdf" });
    fireEvent.change(dialog.querySelector("[name='proforma']"), { target: { files: [pdf] } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    expect(container.querySelector("[name='proveedorId']")).toBeNull();

    dialog = await abrirFormulario();
    expect(within(dialog).queryByRole("alert")).toBeNull();
    expect(dialog.querySelector("[name='proveedorId']")).toHaveValue("");
    expect(dialog.querySelector("[name='productoId']")).toHaveValue("");
    expect(dialog.querySelector("[name='cantidad']")).toHaveValue("");
    expect(within(dialog).getByRole("textbox", { name: /Notas/ })).toHaveValue("");
    expect(dialog.querySelector("[name='proforma']").files).toHaveLength(0);
    expect(dialog.querySelectorAll("[name='productoId'], [name='cantidad']")).toHaveLength(2);

    fireEvent.change(dialog.querySelector("[name='proveedorId']"), { target: { value: "v-1" } });
    fireEvent.change(dialog.querySelector("[name='productoId']"), { target: { value: "p-1" } });
    fireEvent.change(dialog.querySelector("[name='cantidad']"), { target: { value: "3" } });
    crearSolicitudMock.mockResolvedValue({});
    fireEvent.click(within(dialog).getByRole("button", { name: "Crear solicitud" }));

    await waitFor(() => expect(crearSolicitudMock).toHaveBeenCalledOnce());
    expect(crearSolicitudMock.mock.calls[0][0].proformaFile).toBeUndefined();
  });
});
