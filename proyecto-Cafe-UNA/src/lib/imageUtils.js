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
