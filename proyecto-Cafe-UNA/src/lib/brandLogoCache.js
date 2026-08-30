const STORAGE_KEY = "cafe-una-brand-logos";

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

/** Logo para fondos claros (loaders). */
export function getLoaderLogoUrl() {
  const { logoUrl, logoClaroUrl } = readBrandLogos();
  return logoUrl || logoClaroUrl;
}
