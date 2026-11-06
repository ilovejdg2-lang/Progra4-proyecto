// DEV ONLY. Starts the fake API and vite together; Ctrl+C stops both.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MOCK_PORT = 5221;
const VITE_PORT = 5174;

const env = { ...process.env, DEV_BACKEND_URL: `http://127.0.0.1:${MOCK_PORT}/api`, MOCK_PORT: String(MOCK_PORT) };
delete env.NETLIFY; // vite only proxies /api in plain development mode

const run = (args) => spawn(process.execPath, args, { cwd: appRoot, env, stdio: "inherit" });
const children = [
  run([join("tools", "design-mock", "server.mjs")]),
  run([join("node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", String(VITE_PORT), "--strictPort"]),
];

let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

for (const child of children) child.on("exit", (code) => stop(code ?? 1));
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
process.on("exit", () => children.forEach((child) => child.kill()));
console.log(`design-mock: app http://127.0.0.1:${VITE_PORT}  api http://127.0.0.1:${MOCK_PORT}`);
