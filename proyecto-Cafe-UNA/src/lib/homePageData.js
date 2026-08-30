import { obtenerHero, obtenerNavbar, obtenerSeccion, obtenerTarjetasInicio, obtenerEnlaces } from '../services/informacionService';
import { obtenerProductos } from '../services/productosService';
import { mapHero } from './heroData';
import { textoVisible } from './textoVisible';

function pickString(data, camelKey, pascalKey) {
  const value = data?.[camelKey] ?? data?.[pascalKey];
  return typeof value === 'string' ? textoVisible(value.trim()) : '';
}

/** Sección bilingüe cruda (ES + EN) para localizar al renderizar. */
function trimSectionRaw(section) {
  return {
    title: pickString(section, 'title', 'Title'),
    titleEn: pickString(section, 'titleEn', 'TitleEn'),
    description: pickString(section, 'description', 'Description'),
    descriptionEn: pickString(section, 'descriptionEn', 'DescriptionEn'),
    eyebrow: pickString(section, 'eyebrow', 'Eyebrow'),
    eyebrowEn: pickString(section, 'eyebrowEn', 'EyebrowEn'),
    image: pickString(section, 'image', 'Image'),
    linkUrl: pickString(section, 'linkUrl', 'LinkUrl'),
    linkText: pickString(section, 'linkText', 'LinkText'),
    linkTextEn: pickString(section, 'linkTextEn', 'LinkTextEn'),
  };
}

/**
 * Datos del inicio en bruto (español + inglés).
 * La UI elige el idioma al mostrar con localizarObjeto / mapHeroLocalizado.
 */
export async function fetchHomePageData() {
  const [
    heroInfo,
    spotlight,
    featured,
    iniciativas,
    location,
    tarjetas,
    productList,
    navbarInfo,
    navLinks,
  ] = await Promise.all([
    obtenerHero(),
    obtenerSeccion('homeSpotlight'),
    obtenerSeccion('homeFeatured'),
    obtenerSeccion('homeIniciativas'),
    obtenerSeccion('homeLocation'),
    obtenerTarjetasInicio(),
    obtenerProductos().catch(() => []),
    obtenerNavbar().catch(() => null),
    obtenerEnlaces('Navbar').catch(() => []),
  ]);

  return {
    hero: mapHero(heroInfo),
    navbar: {
      logoUrl: typeof navbarInfo?.logoUrl === 'string' ? navbarInfo.logoUrl.trim() : '',
      logoClaroUrl: typeof navbarInfo?.logoClaroUrl === 'string' ? navbarInfo.logoClaroUrl.trim() : '',
    },
    enlacesNavbar: Array.isArray(navLinks)
      ? navLinks.map((enlace) => ({
          ...enlace,
          etiqueta: enlace.etiqueta ?? enlace.Etiqueta ?? '',
          etiquetaEn: enlace.etiquetaEn ?? enlace.EtiquetaEn ?? '',
          Etiqueta: enlace.etiqueta ?? enlace.Etiqueta ?? '',
          EtiquetaEn: enlace.etiquetaEn ?? enlace.EtiquetaEn ?? '',
        }))
      : [],
    aboutTeaser: trimSectionRaw(spotlight),
    featuredSection: trimSectionRaw(featured),
    iniciativasSection: trimSectionRaw(iniciativas),
    locationSection: trimSectionRaw(location),
    tarjetasInicio: Array.isArray(tarjetas)
      ? tarjetas.map((item) => ({
          clave: item.clave || item.Clave || '',
          etiqueta: item.etiqueta || item.Etiqueta || '',
          etiquetaEn: item.etiquetaEn || item.EtiquetaEn || '',
          titulo: item.titulo || item.Titulo || '',
          tituloEn: item.tituloEn || item.TituloEn || '',
          descripcion: item.descripcion || item.Descripcion || '',
          descripcionEn: item.descripcionEn || item.DescripcionEn || '',
          ruta: item.ruta || item.Ruta || '',
          textoBoton: item.textoBoton || item.TextoBoton || '',
          textoBotonEn: item.textoBotonEn || item.TextoBotonEn || '',
        }))
      : [],
    products: Array.isArray(productList)
      ? productList.map((item) => ({
          ...item,
          nombre: item?.nombre ?? item?.Nombre ?? '',
          nombreEn: item?.nombreEn ?? item?.NombreEn ?? '',
          descripcion: item?.descripcion ?? item?.Descripcion ?? '',
          descripcionEn: item?.descripcionEn ?? item?.DescripcionEn ?? '',
        }))
      : [],
  };
}
