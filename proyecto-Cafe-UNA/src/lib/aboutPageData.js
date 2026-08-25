import { obtenerInformacionSobreNosotros } from '../services/informacionService';

function getImage(data) {
  return typeof data?.image === 'string'
    ? data.image.trim()
    : typeof data?.Image === 'string'
      ? data.Image.trim()
      : '';
}

export async function fetchAboutPageData() {
  const info = await obtenerInformacionSobreNosotros();

  return {
    historiaTitulo: typeof info.historia?.title === 'string' ? info.historia.title.trim() : '',
    historia: typeof info.historia?.description === 'string' ? info.historia.description.trim() : '',
    historiaImage: getImage(info.historia),
    missionData: {
      title: typeof info.mission?.title === 'string' ? info.mission.title.trim() : '',
      description: typeof info.mission?.description === 'string' ? info.mission.description.trim() : '',
      image: getImage(info.mission),
    },
    visionData: {
      title: typeof info.vision?.title === 'string' ? info.vision.title.trim() : '',
      description: typeof info.vision?.description === 'string' ? info.vision.description.trim() : '',
      image: getImage(info.vision),
    },
    galleryData: Array.isArray(info.gallery) ? info.gallery : [],
  };
}
