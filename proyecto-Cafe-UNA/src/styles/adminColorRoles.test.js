import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = join(import.meta.dirname, "..");
const css = readFileSync(join(srcDir, "index.css"), "utf8").replace(/\r\n/g, "\n");
const adminDark = readFileSync(join(srcDir, "styles", "adminDark.css"), "utf8").replace(/\r\n/g, "\n");

const block = (selectorRe) => css.match(selectorRe)?.[0] ?? "";
const light = block(/\nbody\.admin-route-active\s*\{[^}]*--admin-bg:[\s\S]*?\n\}/);
const dark = block(/\nhtml\.admin-theme-dark body\.admin-route-active\s*\{[^}]*--admin-bg:[\s\S]*?\n\}/);
const rule = (selector) => {
  const start = css.indexOf(`body.admin-route-active ${selector} {`);
  return start < 0 ? "" : css.slice(start, css.indexOf("}", start) + 1);
};
const BLACK = /#111\b|#000\b|#020617|slate-950|\bblack\b|rgb\(\s*0,\s*0,\s*0|rgb\(\s*2,\s*6,\s*23/i;

describe("admin color roles (CSS)", () => {
  it("defines the coffee-soft token in both themes", () => {
    expect(light).toMatch(/--admin-accent-coffee-soft:\s*#f6efec/i);
    expect(dark).toMatch(/--admin-accent-coffee-soft:\s*#2a1d19/i);
  });

  it("primary is coffee with on-coffee text and a coffee hover", () => {
    const base = rule(".admin-role-primary");
    expect(base).toContain("background-color: var(--admin-accent-coffee)");
    expect(base).toContain("color: var(--admin-on-accent-coffee)");
    expect(rule(".admin-role-primary:hover:not(:disabled)")).toContain("var(--admin-accent-coffee-hover)");
  });

  it("danger and positive are text + border on a transparent fill", () => {
    const danger = rule(".admin-role-danger");
    expect(danger).toContain("background-color: transparent");
    expect(danger).toContain("border-color: var(--admin-status-danger-text)");
    expect(danger).toContain("color: var(--admin-status-danger-text)");
    const positive = rule(".admin-role-positive");
    expect(positive).toContain("background-color: transparent");
    expect(positive).toContain("color: var(--admin-status-success-text)");
  });

  it("selected is coffee soft background with a coffee border", () => {
    const sel = rule(".admin-role-selected");
    expect(sel).toContain("background-color: var(--admin-accent-coffee-soft)");
    expect(sel).toContain("border-color: var(--admin-accent-coffee)");
  });

  it("no role rule uses literal black or slate-950", () => {
    for (const name of ["primary", "quiet", "danger", "positive", "selected", "surface"]) {
      expect(rule(`.admin-role-${name}`)).not.toMatch(BLACK);
    }
  });

  it("switch 'on' is coffee in admin scope and no admin rule paints it black", () => {
    const on = rule(".ui-switch__track.is-on");
    expect(on).toContain("background: var(--admin-accent-coffee)");
    const all = `${css}\n${adminDark}`;
    const switchRules = all.match(/[^{}]*\.ui-switch__track[^{}]*\{[^}]*\}/g) ?? [];
    const adminScoped = switchRules.filter((r) => /admin-route-active|admin-theme-dark/.test(r));
    expect(adminScoped.length).toBeGreaterThan(0);
    for (const r of adminScoped) {
      expect(r.slice(r.indexOf("{"))).not.toMatch(BLACK);
    }
  });
});
