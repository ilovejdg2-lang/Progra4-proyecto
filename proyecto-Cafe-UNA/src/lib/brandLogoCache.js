const STORAGE_KEY = "cafe-una-brand-logos";

/** Logo blanco/rojo para fondos oscuros (admin dark, hero, loaders). */
export const LOGO_CLARO_FALLBACK = "/logoblancoyrojo.png";
/** Logo para fondos claros. */
export const LOGO_OSCURO_FALLBACK = "/logo.webp";

function pickLogo(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function cacheBrandLogos({ logoUrl, logoClaroUrl } = {}) {
  const next = {
    logoUrl: pickLogo(logoUrl),
    logoClaroUrl: pickLogo(logoClaroUrl),
    updatedAt: Date.now(),
  };
  if (!next.logoUrl && !next.logoClaroUrl) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readBrandLogos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { logoUrl: "", logoClaroUrl: "" };
    const parsed = JSON.parse(raw);
    return {
      logoUrl: pickLogo(parsed?.logoUrl),
      logoClaroUrl: pickLogo(parsed?.logoClaroUrl),
    };
  } catch {
    return { logoUrl: "", logoClaroUrl: "" };
  }
}

/** Logo para loaders: oscuro → logo claro (blanco/rojo); claro → logo normal. */
export function getLoaderLogoUrl({ dark = false } = {}) {
  const { logoUrl, logoClaroUrl } = readBrandLogos();
  if (dark) return logoClaroUrl || LOGO_CLARO_FALLBACK || logoUrl;
  return logoUrl || LOGO_OSCURO_FALLBACK || logoClaroUrl;
}
