import { normalizeImageUrl } from './imageUtils';
import { productoPuedeDestacarse } from './productoDisponibilidad';

export function collectHomeImageUrls(data) {
  if (!data) return [];

  const urls = [];

  const heroUrl = normalizeImageUrl(data.hero?.backgroundImage, { width: 1920 });
  if (heroUrl) urls.push(heroUrl);

  const logoUrl = normalizeImageUrl(data.navbar?.logoUrl, { width: 480 });
  if (logoUrl) urls.push(logoUrl);

  const logoClaroUrl = normalizeImageUrl(data.navbar?.logoClaroUrl, { width: 480 });
  if (logoClaroUrl) urls.push(logoClaroUrl);

  const aboutUrl = normalizeImageUrl(data.aboutTeaser?.image, { width: 900 });
  if (aboutUrl) urls.push(aboutUrl);

  const featured = (Array.isArray(data.products) ? data.products : [])
    .filter((product) => product.esDestacado && productoPuedeDestacarse(product))
    .slice(0, 3);

  featured.forEach((product) => {
    const productUrl = normalizeImageUrl(product.imagen, { width: 800 }) || product.imagen;
    if (productUrl) urls.push(productUrl);
  });

  return [...new Set(urls)];
}
