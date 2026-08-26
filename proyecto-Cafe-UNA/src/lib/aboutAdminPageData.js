import { obtenerInformacionSobreNosotros } from '../services/informacionService';

function normalizarSeccion(data = {}) {
  return {
    ...data,
    title: data?.title ?? data?.Title ?? '',
    description: data?.description ?? data?.Description ?? '',
    image: data?.image ?? data?.Image ?? '',
    eyebrow: data?.eyebrow ?? data?.Eyebrow ?? '',
  };
}

function normalizarGaleria(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    title: item?.title ?? item?.Title ?? '',
    image: item?.image ?? item?.Image ?? '',
    categoria: item?.categoria ?? item?.Categoria ?? '',
  }));
}

export async function fetchAboutAdminPageData() {
  const data = await obtenerInformacionSobreNosotros();

  return {
    ...data,
    historia: normalizarSeccion(data?.historia),
    mission: normalizarSeccion(data?.mission),
    vision: normalizarSeccion(data?.vision),
    gallery: normalizarGaleria(data?.gallery),
  };
}
