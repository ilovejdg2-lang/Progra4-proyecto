/**
 * Convierte un enlace de Google Maps (del backend) a URL usable en <iframe>.
 * Los enlaces normales de maps.google.com no se renderizan en iframe sin output=embed.
 */
export function esUrlGoogleMaps(mapsUrl) {
  const url = String(mapsUrl ?? "").trim();
  if (!url) return false;
  return /google\.[^/]*\/maps/i.test(url)
    || /maps\.app\.goo\.gl/i.test(url)
    || /goo\.gl\/maps/i.test(url)
    || /\/maps\/embed\b/i.test(url)
    || /output=embed/i.test(url);
}

export function toGoogleMapsEmbedUrl(mapsUrl) {
  const url = String(mapsUrl ?? '').trim();
  if (!esUrlGoogleMaps(url)) return '';

  if (/output=embed/i.test(url) || /\/maps\/embed\b/i.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);

    const q = parsed.searchParams.get('q') || parsed.searchParams.get('query');
    if (q) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }

    const pb = parsed.searchParams.get('pb');
    if (pb) {
      return `https://www.google.com/maps/embed?pb=${pb}`;
    }

    const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) {
      const place = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }

    const coordMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (coordMatch) {
      return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
    }
  } catch {
    // URL inválida: se intenta usar el texto completo como búsqueda.
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
}
