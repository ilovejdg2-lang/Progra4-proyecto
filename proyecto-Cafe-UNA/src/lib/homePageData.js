import { obtenerHero, obtenerNavbar, obtenerSeccion, obtenerTarjetasInicio, obtenerEnlaces } from '../services/informacionService';
import { obtenerProductos } from '../services/productosServices';
import { mapHero } from './heroData';

function pickString(data, camelKey, pascalKey) {
  const value = data?.[camelKey] ?? data?.[pascalKey];
  return typeof value === 'string' ? value.trim() : '';
}

function trimSection(section) {
  return {
    title: pickString(section, 'title', 'Title'),
    description: pickString(section, 'description', 'Description'),
    eyebrow: pickString(section, 'eyebrow', 'Eyebrow'),
    image: pickString(section, 'image', 'Image'),
    linkUrl: pickString(section, 'linkUrl', 'LinkUrl'),
    linkText: pickString(section, 'linkText', 'LinkText'),
  };
}

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

  const spotlightData = trimSection(spotlight);
  const featuredData = trimSection(featured);
  const iniciativasData = trimSection(iniciativas);
  const locationData = trimSection(location);

  return {
    hero: mapHero(heroInfo),
    navbar: {
      logoUrl: typeof navbarInfo?.logoUrl === 'string' ? navbarInfo.logoUrl.trim() : '',
      logoClaroUrl: typeof navbarInfo?.logoClaroUrl === 'string' ? navbarInfo.logoClaroUrl.trim() : '',
    },
    enlacesNavbar: Array.isArray(navLinks) ? navLinks : [],
    aboutTeaser: {
      title: spotlightData.title,
      description: spotlightData.description,
      image: spotlightData.image,
      linkUrl: spotlightData.linkUrl,
      linkText: spotlightData.linkText,
    },
    featuredSection: {
      title: featuredData.title,
      description: featuredData.description,
      linkUrl: featuredData.linkUrl,
      linkText: featuredData.linkText,
    },
    iniciativasSection: {
      eyebrow: iniciativasData.eyebrow,
      title: iniciativasData.title,
      description: iniciativasData.description,
    },
    locationSection: {
      eyebrow: locationData.eyebrow,
      title: locationData.title,
      description: locationData.description,
      linkUrl: locationData.linkUrl,
      linkText: locationData.linkText,
    },
    tarjetasInicio: Array.isArray(tarjetas)
      ? tarjetas.map((item) => ({
          clave: item.clave || item.Clave || '',
          etiqueta: item.etiqueta || item.Etiqueta || '',
          titulo: item.titulo || item.Titulo || '',
          descripcion: item.descripcion || item.Descripcion || '',
          ruta: item.ruta || item.Ruta || '',
          textoBoton: item.textoBoton || item.TextoBoton || '',
        }))
      : [],
    products: Array.isArray(productList) ? productList : [],
  };
}
