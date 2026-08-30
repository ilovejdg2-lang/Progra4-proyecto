import {
  obtenerInformacion,
  obtenerSeccion,
  obtenerTarjetasInicio,
} from '../services/informacionService';
import { mapHero } from './heroData';
import { textoVisible } from './textoVisible';

function textoCampo(valor) {
  return typeof valor === 'string' ? textoVisible(valor.trim()) : '';
}

function mapSeccionInicio(data) {
  return {
    eyebrow: textoCampo(data?.eyebrow ?? data?.Eyebrow),
    title: textoCampo(data?.title ?? data?.Title),
    description: textoCampo(data?.description ?? data?.Description),
    image: textoCampo(data?.image ?? data?.Image),
    linkUrl: textoCampo(data?.linkUrl) || textoCampo(data?.LinkUrl),
    linkText: textoCampo(data?.linkText) || textoCampo(data?.LinkText),
  };
}

function mapTarjetaInicio(item) {
  return {
    clave: item?.clave || item?.Clave || '',
    etiqueta: textoCampo(item?.etiqueta || item?.Etiqueta),
    titulo: textoCampo(item?.titulo || item?.Titulo),
    descripcion: textoCampo(item?.descripcion || item?.Descripcion),
    ruta: item?.ruta || item?.Ruta || '',
    textoBoton: textoCampo(item?.textoBoton || item?.TextoBoton),
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

  const hero = bulk?.hero ? mapHero(bulk.hero) : null;
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
