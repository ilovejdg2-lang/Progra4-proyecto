/**
 * Auditoría de desborde horizontal en viewports móviles.
 * Uso: node tools/responsive-overflow-audit.mjs
 * Requiere Vite en http://localhost:5173
 */
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium, webkit } = require("playwright");

const BASE = process.env.AUDIT_BASE_URL || "http://localhost:5173";
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "responsive-audit-out");

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "iphone-pro-max", width: 430, height: 932 },
  { name: "android-compact", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
];

const PUBLIC_ROUTES = [
  "/",
  "/productos",
  "/sobre-nosotros",
  "/voluntariado",
  "/donaciones",
  "/login",
  "/registro",
];

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientWidth = doc.clientWidth;
    const offenders = [];
    const nodes = document.querySelectorAll("body *");
    for (const el of nodes) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.right > clientWidth + 1 || rect.left < -1) {
        const tag = el.tagName.toLowerCase();
        const cls = typeof el.className === "string" ? el.className.slice(0, 80) : "";
        offenders.push({
          tag,
          id: el.id || "",
          className: cls,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
        if (offenders.length >= 12) break;
      }
    }
    return {
      scrollWidth,
      clientWidth,
      overflowPx: Math.max(0, scrollWidth - clientWidth),
      offenders,
    };
  });
}

async function auditBrowser(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const results = [];
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.width < 768,
        hasTouch: vp.width < 768,
      });
      const page = await context.newPage();
      for (const route of PUBLIC_ROUTES) {
        const url = `${BASE}${route}`;
        let status = "ok";
        let measure = null;
        let error = "";
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await page.waitForTimeout(700);
          measure = await measureOverflow(page);
          if (measure.overflowPx > 2) status = "overflow";
          const shot = path.join(OUT, `${label}-${vp.name}${route.replace(/\W+/g, "_") || "_home"}.png`);
          await page.screenshot({ path: shot, fullPage: false });
        } catch (err) {
          status = "error";
          error = err instanceof Error ? err.message : String(err);
        }
        results.push({ browser: label, viewport: vp.name, route, status, measure, error });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function auditDonationFormHarness(browserType, label) {
  const browser = await browserType.launch({ headless: true });
  const results = [];
  try {
    for (const vp of VIEWPORTS.filter((v) => v.width <= 430)) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      // Harness: carga CSS de la app y replica la estructura crítica del formulario
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div id="harness" style="padding:16px;max-width:100%;box-sizing:border-box;background:#0f172a">
            <section class="min-w-0 max-w-full overflow-x-clip rounded-2xl border p-3" style="border-color:#334155;background:#020617">
              <h2 style="color:#fff;font:600 1rem/1.3 system-ui">Solicitar donación o regalía</h2>
              <form class="min-w-0 max-w-full space-y-4 overflow-x-clip" style="margin-top:12px">
                <div class="grid min-w-0 grid-cols-1 gap-3" style="display:grid;gap:12px">
                  <label class="flex min-w-0 max-w-full flex-col gap-1.5 overflow-hidden" style="display:flex;flex-direction:column;gap:6px;color:#e2e8f0;font:600 0.875rem system-ui">
                    Fecha de salida
                    <input id="fecha-salida" type="date" value="2026-11-15"
                      class="box-border block h-[var(--control-height)] w-full min-w-0 max-w-full"
                      style="box-sizing:border-box;display:block;width:100%;max-width:100%;min-width:0;height:44px;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#fff;padding:0 12px" />
                  </label>
                  <label class="flex min-w-0 max-w-full flex-col gap-1.5 overflow-hidden" style="display:flex;flex-direction:column;gap:6px;color:#e2e8f0;font:600 0.875rem system-ui">
                    Destinatario
                    <input style="box-sizing:border-box;display:block;width:100%;max-width:100%;min-width:0;height:44px;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#fff;padding:0 12px" />
                  </label>
                </div>
                <button type="button" style="height:44px;width:100%;border-radius:9999px;background:#78350f;color:#fff;font:600 0.875rem system-ui;border:0">Enviar solicitud</button>
              </form>
            </section>
          </div>`;
      });
      const dateBox = await page.locator("#fecha-salida").boundingBox();
      const sectionBox = await page.locator("#harness > section").boundingBox();
      const overflows =
        dateBox && sectionBox
          ? dateBox.x + dateBox.width > sectionBox.x + sectionBox.width + 1
          : true;
      const shot = path.join(OUT, `${label}-donacion-form-${vp.name}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      results.push({
        browser: label,
        viewport: vp.name,
        route: "harness:donacion-form",
        status: overflows ? "overflow" : "ok",
        measure: {
          dateWidth: dateBox?.width,
          sectionWidth: sectionBox?.width,
          overflows,
        },
        error: "",
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const all = [];

  console.log("Chromium…");
  all.push(...(await auditBrowser(chromium, "chromium")));
  all.push(...(await auditDonationFormHarness(chromium, "chromium")));

  let webkitOk = true;
  try {
    console.log("WebKit…");
    all.push(...(await auditBrowser(webkit, "webkit")));
    all.push(...(await auditDonationFormHarness(webkit, "webkit")));
  } catch (err) {
    webkitOk = false;
    all.push({
      browser: "webkit",
      viewport: "-",
      route: "-",
      status: "error",
      measure: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const summary = {
    base: BASE,
    webkitOk,
    generatedAt: new Date().toISOString(),
    totals: {
      ok: all.filter((r) => r.status === "ok").length,
      overflow: all.filter((r) => r.status === "overflow").length,
      error: all.filter((r) => r.status === "error").length,
    },
    results: all,
  };
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify(summary.totals, null, 2));
  const bad = all.filter((r) => r.status !== "ok");
  if (bad.length) {
    console.log("Issues:");
    for (const row of bad.slice(0, 40)) {
      console.log(`- [${row.browser}/${row.viewport}] ${row.route}: ${row.status} ${row.error || row.measure?.overflowPx || ""}`);
    }
  }
  process.exit(summary.totals.overflow > 0 || summary.totals.error > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
