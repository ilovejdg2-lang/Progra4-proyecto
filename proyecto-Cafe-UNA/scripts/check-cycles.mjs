import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, dirname } from "path";

const root = "src";
const files = [];

function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(n) && !n.includes(".test.")) files.push(p);
  }
}
walk(root);

const graph = new Map();

function resolve(from, spec) {
  if (!spec.startsWith(".")) return null;
  const base = join(dirname(from), spec);
  const cands = [base, `${base}.js`, `${base}.jsx`, join(base, "index.js"), join(base, "index.jsx")];
  for (const c of cands) {
    try {
      statSync(c);
      return c.replace(/\\/g, "/");
    } catch {
      /* miss */
    }
  }
  return null;
}

for (const f of files) {
  const text = readFileSync(f, "utf8");
  const imports = [];
  for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const t = resolve(f, m[1]);
    if (t) imports.push(t);
  }
  graph.set(f.replace(/\\/g, "/"), imports);
}

const ids = new Map();
const low = new Map();
const on = [];
const stack = [];
const sccs = [];
let id = 0;

function strong(v) {
  ids.set(v, id);
  low.set(v, id);
  id += 1;
  stack.push(v);
  on.push(v);
  for (const w of graph.get(v) || []) {
    if (!ids.has(w)) {
      strong(w);
      low.set(v, Math.min(low.get(v), low.get(w)));
    } else if (on.includes(w)) {
      low.set(v, Math.min(low.get(v), ids.get(w)));
    }
  }
  if (low.get(v) === ids.get(v)) {
    const scc = [];
    let w;
    do {
      w = stack.pop();
      on.pop();
      scc.push(w);
    } while (w !== v);
    if (scc.length > 1) sccs.push(scc);
  }
}

for (const v of graph.keys()) {
  if (!ids.has(v)) strong(v);
}

console.log("cycles", sccs.length);
for (const scc of sccs) {
  console.log(scc.map((p) => relative(root, p)).join(" -> "));
}
