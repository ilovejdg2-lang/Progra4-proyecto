import {
  obtenerInformacion,
  obtenerSeccion,
  obtenerTarjetasInicio,
  obtenerFaqInicio,
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

function mapFaqItem(item) {
  return {
    id: item?.id ?? item?.Id ?? null,
    pregunta: textoCampo(item?.pregunta ?? item?.Pregunta),
    respuesta: textoCampo(item?.respuesta ?? item?.Respuesta),
    orden: Number(item?.orden ?? item?.Orden ?? 0) || 0,
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
    homeFaq,
    tarjetas,
    faqItems,
  ] = await Promise.all([
    obtenerInformacion().catch(() => null),
    obtenerSeccion('homeSpotlight').catch(() => null),
    obtenerSeccion('homeFeatured').catch(() => null),
    obtenerSeccion('homeIniciativas').catch(() => null),
    obtenerSeccion('homeLocation').catch(() => null),
    obtenerSeccion('homeFaq').catch(() => null),
    obtenerTarjetasInicio().catch(() => []),
    obtenerFaqInicio().catch(() => []),
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
      homeFaq: mapSeccionInicio(homeFaq),
    },
    navbar,
    footer,
    enlacesNavbar: filtrarEnlaces(enlaces, 'Navbar'),
    enlacesFooter: filtrarEnlaces(enlaces, 'FooterExplorar'),
    tarjetasInicio: Array.isArray(tarjetas) ? tarjetas.map(mapTarjetaInicio) : [],
    faqInicio: Array.isArray(faqItems) ? faqItems.map(mapFaqItem) : [],
    hasError: !hero && !navbar && !footer,
  };
}
