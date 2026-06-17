import { obtenerInformacionSobreNosotros } from '../services/informacionService';

const infoInicial = {
  hero: {},
  historia: { title: '', description: '' },
  mission: { title: '', description: '' },
  vision: { title: '', description: '' },
  gallery: [],
};

export async function fetchAboutAdminPageData() {
  const data = await obtenerInformacionSobreNosotros();

  return {
    ...infoInicial,
    ...data,
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
  };
}
