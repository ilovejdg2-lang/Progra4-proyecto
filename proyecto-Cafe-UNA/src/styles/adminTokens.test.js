import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Names set at runtime through style.setProperty (see src/lib/adminTheme.js).
const RUNTIME_TOKENS = new Set(["--admin-theme-x", "--admin-theme-y", "--admin-theme-r"]);

const srcDir = join(process.cwd(), "src");

// Vitest strips CSS content from imports, so the sources are read from disk.
const sources = readdirSync(srcDir, { recursive: true })
  .map(String)
  .filter((file) => /\.(jsx|css)$/.test(file))
  .map((file) => ({ file, text: readFileSync(join(srcDir, file), "utf8") }));

function collect(pattern) {
  const found = new Map();
  for (const { file, text } of sources) {
    for (const match of text.matchAll(pattern)) {
      const name = match[1];
      if (!found.has(name)) found.set(name, new Set());
      found.get(name).add(file);
    }
  }
  return found;
}

describe("admin design tokens", () => {
  it("defines every var(--admin-*) that the source uses", () => {
    const used = collect(/var\(\s*(--admin-[a-z0-9-]+)/g);
    const defined = collect(/(--admin-[a-z0-9-]+)\s*:/g);

    expect(used.size).toBeGreaterThan(0);
    expect(defined.size).toBeGreaterThan(0);

    const undefinedTokens = [...used.entries()]
      .filter(([name]) => !defined.has(name) && !RUNTIME_TOKENS.has(name))
      .map(([name, files]) => `${name} (used in ${[...files].join(", ")})`);

    expect(undefinedTokens).toEqual([]);
  });
});
