import { obtenerHero, obtenerNavbar, obtenerSeccion, obtenerTarjetasInicio, obtenerEnlaces } from '../services/informacionService';
import { obtenerProductos } from '../services/productosServices';
import { mapHero } from './heroData';

function trimSection(section) {
  return {
    title: typeof section?.title === 'string' ? section.title.trim() : '',
    description: typeof section?.description === 'string' ? section.description.trim() : '',
    eyebrow: typeof section?.eyebrow === 'string' ? section.eyebrow.trim() : '',
    image: typeof section?.image === 'string' ? section.image.trim() : '',
    linkUrl:
      typeof section?.linkUrl === 'string'
        ? section.linkUrl.trim()
        : typeof section?.LinkUrl === 'string'
          ? section.LinkUrl.trim()
          : '',
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
    },
    featuredSection: {
      title: featuredData.title,
      description: featuredData.description,
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
    },
    tarjetasInicio: Array.isArray(tarjetas)
      ? tarjetas.map((item) => ({
          clave: item.clave || item.Clave || '',
          etiqueta: item.etiqueta || item.Etiqueta || '',
          titulo: item.titulo || item.Titulo || '',
          descripcion: item.descripcion || item.Descripcion || '',
          ruta: item.ruta || item.Ruta || '',
        }))
      : [],
    products: Array.isArray(productList) ? productList : [],
  };
}
