import { obtenerInformacionSobreNosotros } from '../services/informacionService';

function getImage(data) {
  return typeof data?.image === 'string'
    ? data.image.trim()
    : typeof data?.Image === 'string'
      ? data.Image.trim()
      : '';
}

function pickText(data, ...keys) {
  for (const key of keys) {
    if (typeof data?.[key] === 'string' && data[key].trim()) return data[key].trim();
  }
  return '';
}

function normalizarGaleria(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    id: item.id ?? item.Id,
    title: pickText(item, 'title', 'Title'),
    image: pickText(item, 'image', 'Image'),
    categoria: pickText(item, 'categoria', 'Categoria'),
  }));
}

export async function fetchAboutPageData() {
  const info = await obtenerInformacionSobreNosotros();

  return {
    historiaTitulo: pickText(info.historia, 'title', 'Title'),
    historia: pickText(info.historia, 'description', 'Description'),
    historiaEyebrow: pickText(info.historia, 'eyebrow', 'Eyebrow'),
    historiaImage: getImage(info.historia),
    missionData: {
      title: pickText(info.mission, 'title', 'Title'),
      description: pickText(info.mission, 'description', 'Description'),
      eyebrow: pickText(info.mission, 'eyebrow', 'Eyebrow'),
      image: getImage(info.mission),
    },
    visionData: {
      title: pickText(info.vision, 'title', 'Title'),
      description: pickText(info.vision, 'description', 'Description'),
      eyebrow: pickText(info.vision, 'eyebrow', 'Eyebrow'),
      image: getImage(info.vision),
    },
    galleryData: normalizarGaleria(info.gallery),
  };
}
