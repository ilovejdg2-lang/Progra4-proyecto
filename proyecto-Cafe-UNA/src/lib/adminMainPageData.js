import {
  obtenerInformacion,
  obtenerSeccion,
  obtenerTarjetasInicio,
} from '../services/informacionService';

function mapSeccionInicio(data) {
  return {
    eyebrow: typeof data?.eyebrow === 'string' ? data.eyebrow.trim() : '',
    title: typeof data?.title === 'string' ? data.title.trim() : '',
    description: typeof data?.description === 'string' ? data.description.trim() : '',
    image: typeof data?.image === 'string' ? data.image.trim() : '',
    linkUrl:
      typeof data?.linkUrl === 'string'
        ? data.linkUrl.trim()
        : typeof data?.LinkUrl === 'string'
          ? data.LinkUrl.trim()
          : '',
  };
}

function mapTarjetaInicio(item) {
  return {
    clave: item?.clave || item?.Clave || '',
    etiqueta: item?.etiqueta || item?.Etiqueta || '',
    titulo: item?.titulo || item?.Titulo || '',
    descripcion: item?.descripcion || item?.Descripcion || '',
    ruta: item?.ruta || item?.Ruta || '',
  };
}

function filtrarEnlaces(enlaces, seccion) {
  if (!Array.isArray(enlaces)) return [];
  return enlaces.filter((item) => {
    const valor = item?.seccion || item?.Seccion || '';
    return String(valor).toLowerCase() === seccion.toLowerCase();
  });
}

export async function fetchAdminMainPageData() {
  const [
    bulk,
    homeSpotlight,
    homeFeatured,
    homeIniciativas,
    homeLocation,
    tarjetas,
  ] = await Promise.all([
    obtenerInformacion().catch(() => null),
    obtenerSeccion('homeSpotlight').catch(() => null),
    obtenerSeccion('homeFeatured').catch(() => null),
    obtenerSeccion('homeIniciativas').catch(() => null),
    obtenerSeccion('homeLocation').catch(() => null),
    obtenerTarjetasInicio().catch(() => []),
  ]);

  const hero = bulk?.hero ?? null;
  const navbar = bulk?.navbar ?? null;
  const footer = bulk?.footer ?? null;
  const enlaces = bulk?.enlaces ?? [];

  return {
    hero,
    seccionesInicio: {
      homeSpotlight: mapSeccionInicio(homeSpotlight),
      homeFeatured: mapSeccionInicio(homeFeatured),
      homeIniciativas: mapSeccionInicio(homeIniciativas),
      homeLocation: mapSeccionInicio(homeLocation),
    },
    navbar,
    footer,
    enlacesNavbar: filtrarEnlaces(enlaces, 'Navbar'),
    enlacesFooter: filtrarEnlaces(enlaces, 'FooterExplorar'),
    tarjetasInicio: Array.isArray(tarjetas) ? tarjetas.map(mapTarjetaInicio) : [],
    hasError: !hero && !navbar && !footer,
  };
}
