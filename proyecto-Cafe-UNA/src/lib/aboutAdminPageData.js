import { obtenerInformacionSobreNosotros } from '../services/informacionService';

export async function fetchAboutAdminPageData() {
  const data = await obtenerInformacionSobreNosotros();

  return {
    ...data,
    gallery: Array.isArray(data?.gallery) ? data.gallery : [],
  };
}
