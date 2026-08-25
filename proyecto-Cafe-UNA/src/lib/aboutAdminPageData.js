import { obtenerInformacionSobreNosotros } from '../services/informacionService';

function normalizarSeccion(data = {}) {
  return {
    ...data,
    title: data?.title ?? data?.Title ?? '',
    description: data?.description ?? data?.Description ?? '',
    image: data?.image ?? data?.Image ?? '',
  };
}

export async function fetchAboutAdminPageData() {
  const data = await obtenerInformacionSobreNosotros();

  return {
    ...data,
    historia: normalizarSeccion(data?.historia),
    mission: normalizarSeccion(data?.mission),
    vision: normalizarSeccion(data?.vision),
    gallery: Array.isArray(data?.gallery) ? data.gallery : [],
  };
}
