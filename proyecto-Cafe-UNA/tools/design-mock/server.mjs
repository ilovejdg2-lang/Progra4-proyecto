// DEV ONLY. Fake backend for design work. Never import this from src/.
// Node stdlib only. In-memory state, resets on restart. Fake data only.
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

export const HOST = "127.0.0.1";
export const DEFAULT_PORT = 5221;
export const FAKE_LOGIN = { identifier: "admin@mock.test", password: "mock1234" };

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

// The frontend only decodes the payload (sub, unique_name, email, role, exp); no signature check.
function fakeToken(user) {
  const payload = {
    sub: String(user.id),
    unique_name: user.nombre,
    email: user.correo,
    role: user.roles,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
  };
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.mock`;
}

const NOMBRES = [
  "Mariana", "Joaquin", "Valentina", "Sebastian", "Camila", "Andres", "Daniela", "Mateo",
  "Fernanda", "Gabriel", "Lucia", "Esteban", "Paola", "Ricardo", "Natalia", "Felipe",
];
const APELLIDOS = [
  "Rodriguez Villalobos", "Fernandez Barrantes", "Jimenez Corrales", "Vargas Quesada",
  "Solis Montero", "Chaves Alvarado", "Mora Hernandez", "Araya Salazar",
];

function buildUsers() {
  const roleCycle = [
    ["Usuario"], ["Cliente"], ["Vendedor"], ["Admin"], ["Cliente"], ["Vendedor", "Cliente"],
    ["Usuario"], ["Cliente"], ["Admin", "Vendedor"],
  ];
  const users = [
    {
      id: 1, nombre: "Administrador Mock", correo: FAKE_LOGIN.identifier, estado: "Activo",
      roles: ["SuperAdmin"],
    },
    {
      id: 2,
      nombre: "Maria de los Angeles Fernandez-Rodriguez de la Cruz y Quesada Villalobos",
      correo: "maria.de.los.angeles.fernandez.rodriguez.de.la.cruz@cooperativa-cafetalera-ejemplo.example.test",
      estado: "Activo", roles: ["Admin", "Vendedor", "Cliente"], puntosVentaActivos: 0,
    },
  ];
  for (let i = 0; i < 25; i += 1) {
    const roles = roleCycle[i % roleCycle.length];
    const nombre = `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[i % APELLIDOS.length]}`;
    const user = {
      id: i + 3,
      nombre,
      correo: `${NOMBRES[i % NOMBRES.length].toLowerCase()}.${i + 3}@mock.test`,
      estado: i % 4 === 3 ? "Inactivo" : "Activo",
      roles,
    };
    if (roles.includes("Vendedor")) user.puntosVentaActivos = i % 3 === 0 ? 0 : 1 + (i % 2);
    if (roles.includes("Cliente")) {
      const empresa = i % 2 === 0;
      user.tipoCliente = empresa ? "empresa" : "persona";
      user.telefono = `8${String(1000000 + i * 37).slice(0, 7)}`;
      if (empresa) {
        user.razonSocial = `Distribuidora ${APELLIDOS[i % APELLIDOS.length].split(" ")[0]} S.A.`;
        user.cedulaJuridica = `3-101-${String(100000 + i * 13).slice(0, 6)}`;
      } else {
        user.apellidos = APELLIDOS[i % APELLIDOS.length];
        user.identificacion = String(100000000 + i * 7919).slice(0, 9);
        user.tipoDocumento = "cedula";
      }
    }
    users.push(user);
  }
  return users;
}

const users = buildUsers();
const SESSION_USER = users[0];
const pendingCreations = new Map(); // correo -> payload awaiting the fake code
export const FAKE_CODE = "123456";

const STOCK_ALERTS = [
  { id: 1, nombre: "Cafe molido tueste medio 500 g", stockActual: 0, stockMinimo: 10, agotado: true, ubicaciones: [{ codigo: "BOD", nombre: "Bodega central", stock: 0 }] },
  { id: 2, nombre: "Miel de abeja pura", stockActual: 3, stockMinimo: 8, agotado: false, ubicaciones: [{ codigo: "BOD", nombre: "Bodega central", stock: 3 }] },
  { id: 3, nombre: "Cafe en grano premium 1 kg", stockActual: 2, stockMinimo: 6, agotado: false, ubicaciones: [] },
];
const VOLUNTARIADO = [
  { id: 1, estado: "Pendiente", tipoVoluntariado: "Apoyo en cosecha" },
  { id: 2, estado: "Pendiente", tipoVoluntariado: "Talleres educativos" },
];
const DONACIONES = [{ id: 1, estado: "Pendiente", necesidadTitulo: "Materiales de empaque" }];
const PAGED_EMPTY = { data: [], page: 1, pageSize: 10, total: 0, totalPages: 1 };

const findUser = (id) => users.find((u) => String(u.id) === String(id));
const profileOf = (u) => ({ ...u, roles: u.roles });

// Route table: [method, regex on path without the /api prefix, handler].
// A handler returns [status, body]. Params are regex groups.
const routes = [
  ["POST", /^\/auth\/login$/, ({ body }) => {
    if (body.identifier === FAKE_LOGIN.identifier && body.password === FAKE_LOGIN.password) {
      return [200, { token: fakeToken(SESSION_USER) }];
    }
    return [401, { message: "Credenciales incorrectas" }];
  }],
  ["POST", /^\/auth\/refresh$/, () => [200, { token: fakeToken(SESSION_USER) }]],
  ["GET", /^\/perfil$/, () => [200, profileOf(SESSION_USER)]],
  ["GET", /^\/ajustes\/permisos$/, () => [200, { matriz: {} }]],
  ["GET", /^\/ajustes\/idioma$/, () => [200, { idioma: "es" }]],
  ["GET", /^\/informacion\/navbar$/, () => [200, { logoUrl: "", logoClaroUrl: "" }]],
  ["GET", /^\/productos\/alertas-stock$/, () => [200, STOCK_ALERTS]],
  ["GET", /^\/voluntariado\/solicitudes$/, () => [200, VOLUNTARIADO]],
  ["GET", /^\/v1\/donaciones\/solicitudes$/, () => [200, DONACIONES]],
  ["GET", /^\/compras$/, () => [200, PAGED_EMPTY]],
  ["GET", /^\/notificaciones$/, () => [200, { noLeidas: 0, data: [] }]],

  ["GET", /^\/usuarios$/, () => [200, users]],
  ["GET", /^\/usuarios\/asignaciones-puntos\/elegibles$/, () => [200, []]],
  ["GET", /^\/usuarios\/(\d+)\/asignaciones-puntos$/, () => [200, []]],
  ["GET", /^\/usuarios\/(\d+)$/, ({ params }) => {
    const user = findUser(params[0]);
    return user ? [200, user] : [404, { message: "Usuario no encontrado" }];
  }],
  ["POST", /^\/usuarios\/solicitar-creacion$/, ({ body }) => {
    const correo = String(body.correo || "").trim().toLowerCase();
    if (users.some((u) => u.correo.toLowerCase() === correo)) {
      return [409, { message: "Ya existe un usuario con ese correo." }];
    }
    pendingCreations.set(correo, body);
    return [200, { message: `Codigo enviado al correo (mock: ${FAKE_CODE}).` }];
  }],
  ["POST", /^\/usuarios\/confirmar-creacion$/, ({ body }) => {
    const correo = String(body.correo || "").trim().toLowerCase();
    const draft = pendingCreations.get(correo);
    if (!draft || body.token !== FAKE_CODE) return [400, { message: `Codigo invalido (mock: ${FAKE_CODE}).` }];
    pendingCreations.delete(correo);
    const nuevo = { ...draft, id: Math.max(...users.map((u) => u.id)) + 1, correo, estado: "Activo" };
    delete nuevo.passwordHash;
    users.push(nuevo);
    return [201, nuevo];
  }],
  ["PUT", /^\/usuarios\/(\d+)$/, ({ params, body }) => {
    const user = findUser(params[0]);
    if (!user) return [404, { message: "Usuario no encontrado" }];
    const cambios = { ...body };
    for (const key of ["passwordHash", "passwordActual", "id"]) delete cambios[key];
    Object.assign(user, cambios);
    return [200, user];
  }],
  ["PATCH", /^\/usuarios\/(\d+)\/estado$/, ({ params, body }) => {
    const user = findUser(params[0]);
    if (!user) return [404, { message: "Usuario no encontrado" }];
    user.estado = body.estado
      ? (String(body.estado).toLowerCase() === "activo" ? "Activo" : "Inactivo")
      : (user.estado === "Activo" ? "Inactivo" : "Activo");
    return [200, user];
  }],
];

function readJson(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

export function createMockServer({ log = console.log } = {}) {
  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url, `http://${HOST}`);
    const path = pathname.replace(/^\/api/, "") || "/";
    const send = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    const body = req.method === "GET" || req.method === "HEAD" ? {} : await readJson(req);
    for (const [method, pattern, handler] of routes) {
      const match = req.method === method && pattern.exec(path);
      if (match) {
        const [status, payload] = handler({ params: match.slice(1), body });
        return send(status, payload);
      }
    }

    if (req.method === "GET") {
      log(`UNMOCKED GET ${path}`);
      return send(200, []);
    }
    log(`UNMOCKED ${req.method} ${path}`);
    return send(501, { message: `design-mock: ${req.method} ${path} is not mocked.` });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.MOCK_PORT) || DEFAULT_PORT;
  createMockServer().listen(port, HOST, () => {
    console.log(`design-mock listening on http://${HOST}:${port} (dev only, in-memory)`);
    console.log(`login: ${FAKE_LOGIN.identifier} / ${FAKE_LOGIN.password}`);
  });
}
