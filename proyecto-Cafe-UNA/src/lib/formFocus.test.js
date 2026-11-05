import { afterEach, describe, expect, it } from "vitest";

import { topmostOpenDialog } from "./formFocus";

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
