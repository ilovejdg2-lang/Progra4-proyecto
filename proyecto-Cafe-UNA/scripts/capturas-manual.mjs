/**
 * Saca las fotos del manual de uso con Playwright y las guarda en public/manual/<carpeta>/.
 *
 * Requiere el front (npm run dev) y el backend corriendo, y un archivo .env.manual
 * (no se sube a git) con:
 *   MANUAL_URL=http://localhost:5173
 *   MANUAL_ADMIN_CORREO=...      (cuenta SuperAdmin: ve todos los módulos del panel)
 *   MANUAL_ADMIN_CLAVE=...
 *   MANUAL_CLIENTE_CORREO=...    (cuenta con rol Cliente)
 *   MANUAL_CLIENTE_CLAVE=...
 *
 * Uso: npm run manual:capturas            (todo)
 *      npm run manual:capturas -- admin   (solo una carpeta: admin o cliente)
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { SECCIONES_MANUAL } from "../src/lib/manualAdmin.js";
import { SECCIONES_MANUAL_CLIENTE } from "../src/lib/manualCliente.js";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

function leerEnv() {
  const archivo = join(raiz, ".env.manual");
  if (!existsSync(archivo)) return {};
  return Object.fromEntries(
    readFileSync(archivo, "utf8")
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter((linea) => linea && !linea.startsWith("#") && linea.includes("="))
      .map((linea) => {
        const i = linea.indexOf("=");
        return [linea.slice(0, i).trim(), linea.slice(i + 1).trim()];
      }),
  );
}

const env = { ...leerEnv(), ...process.env };
const BASE = (env.MANUAL_URL || "http://localhost:5173").replace(/\/$/, "");

/** Pasos que necesitan tocar algo antes de la foto. La clave es `<seccion>-<imagen>`. */
const ACCIONES_PASOS = {
  "productos-nuevo": async (page) => {
    await page.getByRole("button", { name: /nuevo producto/i }).first().click();
  },
  "productos-categorias": async (page) => {
    await page.getByRole("button", { name: /^categorías$/i }).first().click();
  },
  "comprar-carrito": async (page) => {
    await agregarPrimerProducto(page);
    await page.getByRole("button", { name: /carrito/i }).first().click();
  },
  "comprar-checkout": async (page) => {
    await agregarPrimerProducto(page);
    await page.goto(`${BASE}/checkout`);
  },
};

const RUTA_PASO = {
  "comprar-carrito": "/productos",
  "comprar-checkout": "/productos",
};

async function agregarPrimerProducto(page) {
  await page.goto(`${BASE}/productos`);
  await esperarPantalla(page);
  const boton = page.getByRole("button", { name: /agregar/i }).first();
  if (await boton.count()) {
    await boton.click();
    await page.waitForTimeout(800);
    return;
  }
  await page.locator('a[href^="/productos/"]').first().click();
  await esperarPantalla(page);
  await page.getByRole("button", { name: /agregar/i }).first().click();
  await page.waitForTimeout(800);
}

async function esperarPantalla(page) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function iniciarSesion(page, correo, clave) {
  await page.goto(`${BASE}/login`);
  await page.locator("#identifier").fill(correo);
  await page.locator("#password").fill(clave);
  await page.locator("button.login-button[type=submit]").first().click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 });
  await esperarPantalla(page);
}

function pasosConFoto(seccion) {
  return (seccion.pasos || []).filter((p) => typeof p === "object" && p?.imagen);
}

async function capturarCarpeta(browser, { carpeta, secciones, correo, clave }) {
  if (!correo || !clave) {
    console.warn(`⚠ Sin credenciales para "${carpeta}". Revisá .env.manual.`);
    return { ok: 0, fallas: [] };
  }
  const destino = join(raiz, "public", "manual", carpeta);
  mkdirSync(destino, { recursive: true });

  const context = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-CR" });
  const page = await context.newPage();
  await iniciarSesion(page, correo, clave);

  let ok = 0;
  const fallas = [];
  const guardar = async (nombre) => {
    await page.screenshot({ path: join(destino, `${nombre}.png`) });
    ok += 1;
    console.log(`✓ ${carpeta}/${nombre}.png`);
  };

  for (const seccion of secciones.filter((s) => s.ruta)) {
    try {
      await page.goto(`${BASE}${seccion.ruta}`);
      await esperarPantalla(page);
      await guardar(seccion.id);
    } catch (err) {
      fallas.push(`${carpeta}/${seccion.id}: ${err.message.split("\n")[0]}`);
    }

    for (const paso of pasosConFoto(seccion)) {
      const clavePaso = `${seccion.id}-${paso.imagen}`;
      try {
        await page.goto(`${BASE}${RUTA_PASO[clavePaso] || seccion.ruta}`);
        await esperarPantalla(page);
        await ACCIONES_PASOS[clavePaso]?.(page);
        await esperarPantalla(page);
        await guardar(clavePaso);
      } catch (err) {
        fallas.push(`${carpeta}/${clavePaso}: ${err.message.split("\n")[0]}`);
      }
    }
  }

  await context.close();
  return { ok, fallas };
}

const soloCarpeta = process.argv[2];
const trabajos = [
  {
    carpeta: "admin",
    secciones: SECCIONES_MANUAL,
    correo: env.MANUAL_ADMIN_CORREO,
    clave: env.MANUAL_ADMIN_CLAVE,
  },
  {
    carpeta: "cliente",
    secciones: SECCIONES_MANUAL_CLIENTE.filter((s) => s.id !== "cuenta"),
    correo: env.MANUAL_CLIENTE_CORREO,
    clave: env.MANUAL_CLIENTE_CLAVE,
  },
].filter((t) => !soloCarpeta || t.carpeta === soloCarpeta);

const browser = await chromium.launch();
let total = 0;
const todasLasFallas = [];
try {
  for (const trabajo of trabajos) {
    const { ok, fallas } = await capturarCarpeta(browser, trabajo);
    total += ok;
    todasLasFallas.push(...fallas);
  }

  if (!soloCarpeta || soloCarpeta === "cliente") {
    const context = await browser.newContext({ viewport: { width: 1366, height: 820 }, locale: "es-CR" });
    const page = await context.newPage();
    mkdirSync(join(raiz, "public", "manual", "cliente"), { recursive: true });
    await page.goto(`${BASE}/login`);
    await esperarPantalla(page);
    await page.screenshot({ path: join(raiz, "public", "manual", "cliente", "cuenta.png") });
    total += 1;
    console.log("✓ cliente/cuenta.png");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\nListo: ${total} fotos.`);
if (todasLasFallas.length) {
  console.log(`No se pudieron sacar ${todasLasFallas.length}:`);
  for (const falla of todasLasFallas) console.log(`  - ${falla}`);
}
