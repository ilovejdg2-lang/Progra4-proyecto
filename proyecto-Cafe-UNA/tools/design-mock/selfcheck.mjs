// Run: node tools/design-mock/selfcheck.mjs
import assert from "node:assert/strict";
import { FAKE_CODE, FAKE_LOGIN, HOST, createMockServer } from "./server.mjs";

const server = createMockServer({ log: () => {} });
await new Promise((resolve) => server.listen(0, HOST, resolve));
const base = `http://${HOST}:${server.address().port}/api`;
const call = async (method, path, body) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
};

try {
  assert.equal((await call("POST", "/auth/login", { identifier: "x", password: "y" })).status, 401);
  const login = await call("POST", "/auth/login", FAKE_LOGIN);
  const payload = JSON.parse(Buffer.from(login.json.token.split(".")[1], "base64url").toString());
  assert.deepEqual(payload.role, ["SuperAdmin"]);

  const list = (await call("GET", "/usuarios")).json;
  assert.ok(list.length >= 25);
  assert.ok(list.some((u) => u.estado === "Inactivo"));
  assert.ok(list.some((u) => u.roles.includes("Vendedor")));

  assert.equal((await call("PATCH", "/usuarios/4/estado", { estado: "inactivo" })).json.estado, "Inactivo");

  const nuevo = { nombre: "Nueva Persona", correo: "nueva@mock.test", roles: ["Usuario"] };
  assert.equal((await call("POST", "/usuarios/solicitar-creacion", nuevo)).status, 200);
  assert.equal((await call("POST", "/usuarios/confirmar-creacion", { correo: nuevo.correo, token: "000000" })).status, 400);
  assert.equal((await call("POST", "/usuarios/confirmar-creacion", { correo: nuevo.correo, token: FAKE_CODE })).status, 201);

  assert.deepEqual((await call("GET", "/nope")).json, []);
  assert.equal((await call("DELETE", "/nope")).status, 501);
  console.log("design-mock selfcheck: ok");
} finally {
  server.close();
}
