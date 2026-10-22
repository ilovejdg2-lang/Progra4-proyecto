import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CmsImageField } from "./CmsImageField";

const imageFile = (name = "cafe.png", type = "image/png", size = 4) =>
  new File([new Uint8Array(size)], name, { type });

describe("CmsImageField", () => {
  it("keeps manual URL editing available", () => {
    const onChange = vi.fn();
    render(<CmsImageField label="Imagen de fondo" value="https://example.test/old.png" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Imagen de fondo" }), {
      target: { value: "https://example.test/new.png" },
    });

    expect(onChange).toHaveBeenLastCalledWith("https://example.test/new.png");
  });

  it("uploads a valid replacement immediately and reports the resulting URL", async () => {
    const subir = vi.fn().mockResolvedValue("/api/informacion/imagenes/cafe.png");
    const onChange = vi.fn();
    const onUploadingChange = vi.fn();
    render(
      <CmsImageField
        label="Imagen de fondo"
        value="https://example.test/current.png"
        onChange={onChange}
        onUploadingChange={onUploadingChange}
        subir={subir}
      />,
    );

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo"), {
      target: { files: [imageFile()] },
    });

    await waitFor(() => expect(subir).toHaveBeenCalledWith(expect.any(File)));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("/api/informacion/imagenes/cafe.png"));
    expect(onUploadingChange).toHaveBeenNthCalledWith(1, true);
    expect(onUploadingChange).toHaveBeenLastCalledWith(false);
  });

  it("disables manual edits and a second selection until the pending upload settles", async () => {
    let resolveUpload;
    const subir = vi.fn(() => new Promise((resolve) => {
      resolveUpload = resolve;
    }));
    render(
      <CmsImageField
        label="Imagen de fondo"
        value="https://example.test/current.png"
        onChange={vi.fn()}
        subir={subir}
      />,
    );

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo"), {
      target: { files: [imageFile()] },
    });

    expect(screen.getByRole("textbox", { name: "Imagen de fondo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Subiendo imagen/ })).toBeDisabled();
    resolveUpload("/api/informacion/imagenes/cafe.png");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Imagen de fondo" })).not.toBeDisabled());
  });

  it("retains the current URL and reports an error when the upload fails", async () => {
    const subir = vi.fn().mockRejectedValue(new Error("Fallo de almacenamiento"));
    const onChange = vi.fn();
    render(
      <CmsImageField
        label="Imagen de fondo"
        value="https://example.test/current.png"
        onChange={onChange}
        subir={subir}
      />,
    );

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo"), {
      target: { files: [imageFile()] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Fallo de almacenamiento");
    expect(screen.getByRole("textbox", { name: "Imagen de fondo" })).toHaveValue("https://example.test/current.png");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects unsupported files before uploading and keeps the current URL", () => {
    const subir = vi.fn();
    render(
      <CmsImageField
        label="Imagen de fondo"
        value="https://example.test/current.png"
        onChange={vi.fn()}
        subir={subir}
      />,
    );

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo"), {
      target: { files: [imageFile("cafe.gif", "image/gif")] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("JPG, PNG o WEBP");
    expect(subir).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Imagen de fondo" })).toHaveValue("https://example.test/current.png");
  });

  it("accepts a JPEG filename when the browser omits its MIME type", async () => {
    const subir = vi.fn().mockResolvedValue("/api/informacion/imagenes/cafe.jpeg");
    render(<CmsImageField label="Imagen de fondo" value="" onChange={vi.fn()} subir={subir} />);

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo"), {
      target: { files: [{ name: "cafe.jpeg", type: "", size: 4 }] },
    });

    await waitFor(() => expect(subir).toHaveBeenCalledWith(expect.objectContaining({ name: "cafe.jpeg" })));
  });

  it("rejects files above the CMS 10 MB limit before uploading", () => {
    const subir = vi.fn();
    render(<CmsImageField label="Imagen de fondo" value="" onChange={vi.fn()} subir={subir} />);

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo"), {
      target: { files: [{ name: "large.png", type: "image/png", size: 10 * 1024 * 1024 + 1 }] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("máximo 10 MB");
    expect(subir).not.toHaveBeenCalled();
  });
});
