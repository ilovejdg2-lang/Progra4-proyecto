const UNSPLASH_DEFAULT_PARAMS = "auto=format&fit=crop&w=1600&q=80";
const UNSPLASH_THUMB_PARAMS = "auto=format&fit=crop&w=800&q=80";

export function normalizeImageUrl(url, { width = 1600 } = {}) {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (!trimmed.includes("images.unsplash.com")) {
    return trimmed;
  }

  const params =
    width <= 800 ? UNSPLASH_THUMB_PARAMS : UNSPLASH_DEFAULT_PARAMS.replace("w=1600", `w=${width}`);

  if (trimmed.includes("auto=format") || trimmed.includes("w=")) {
    return trimmed;
  }

  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}${params}`;
}

const DEFAULT_IMAGE_POSITION = "50% 50%";

export function parseImagePosition(value) {
  if (!value || typeof value !== "string") {
    return { x: 50, y: 50 };
  }

  const match = value.trim().match(/([\d.]+)%\s+([\d.]+)%/);
  if (!match) {
    return { x: 50, y: 50 };
  }

  return {
    x: Math.min(100, Math.max(0, Number(match[1]))),
    y: Math.min(100, Math.max(0, Number(match[2]))),
  };
}

export function formatImagePosition({ x, y }) {
  const safeX = Math.min(100, Math.max(0, Number(x) || 50));
  const safeY = Math.min(100, Math.max(0, Number(y) || 50));
  return `${Math.round(safeX)}% ${Math.round(safeY)}%`;
}

export function getImageObjectPosition(value) {
  return value?.trim() || DEFAULT_IMAGE_POSITION;
}
