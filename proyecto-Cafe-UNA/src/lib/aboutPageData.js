import { obtenerInformacionSobreNosotros } from '../services/informacionService';

export async function fetchAboutPageData() {
  const info = await obtenerInformacionSobreNosotros();

  return {
    historiaTitulo: typeof info.historia?.title === 'string' ? info.historia.title.trim() : '',
    historia: typeof info.historia?.description === 'string' ? info.historia.description.trim() : '',
    missionData: {
      title: typeof info.mission?.title === 'string' ? info.mission.title.trim() : '',
      description: typeof info.mission?.description === 'string' ? info.mission.description.trim() : '',
    },
    visionData: {
      title: typeof info.vision?.title === 'string' ? info.vision.title.trim() : '',
      description: typeof info.vision?.description === 'string' ? info.vision.description.trim() : '',
    },
    galleryData: Array.isArray(info.gallery) ? info.gallery : [],
  };
}
