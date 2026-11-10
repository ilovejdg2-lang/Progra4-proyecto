import { afterEach, describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";

import { focusFormError, topmostOpenDialog } from "./formFocus";

function addDialog(open, extra = "") {
  const dialog = document.createElement("dialog");
  if (open) dialog.setAttribute("open", "");
  dialog.dataset.id = extra;
  document.body.appendChild(dialog);
  return dialog;
}

describe("topmostOpenDialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns null when no dialog is open", () => {
    addDialog(false, "closed");
    expect(topmostOpenDialog()).toBeNull();
  });

  it("ignores closed dialogs and non-native role=dialog elements", () => {
    const aside = document.createElement("aside");
    aside.setAttribute("role", "dialog");
    document.body.appendChild(aside);
    addDialog(false, "closed");
    const open = addDialog(true, "open");

    expect(topmostOpenDialog()).toBe(open);
  });

  it("returns the most recently opened dialog when several are open", () => {
    addDialog(true, "first");
    const second = addDialog(true, "second");

    expect(topmostOpenDialog()).toBe(second);
  });
});

describe("focusFormError", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function montar() {
    const form = document.createElement("form");
    form.innerHTML = `
      <button type="button" id="demo-provincia" aria-invalid="true">Provincia</button>
      <input name="nombre" aria-invalid="true" />
    `;
    document.body.appendChild(form);
    return form;
  }

  it("focuses a control without a name through the prefixed id of the first invalid key", async () => {
    const form = montar();

    focusFormError({
      errors: { provincia: "Elegí la provincia", nombre: "Ingresá el nombre" },
      root: form,
      fieldOrder: ["provincia", "nombre"],
      idPrefix: "demo-",
    });

    await waitFor(() => expect(document.activeElement).toBe(form.querySelector("#demo-provincia")));
  });

  it("never jumps past an unfocusable first key to a later field", async () => {
    const form = montar();
    form.querySelector("#demo-provincia").remove();
    form.insertAdjacentHTML("afterbegin", '<div id="grupo" aria-invalid="true" tabindex="-1"></div>');

    focusFormError({
      errors: { fecha: "Elegí la fecha", nombre: "Ingresá el nombre" },
      root: form,
      fieldOrder: ["fecha", "nombre"],
    });

    await waitFor(() => expect(document.activeElement).toBe(form.querySelector("#grupo")));
  });
});
