import { useEffect, useState } from 'react';
import { Coffee, Eye } from 'lucide-react';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import PageLoading from '../../Components/PageLoading/PageLoading';
import { obtenerInformacionSobreNosotros } from '../../services/informacionService';
import './AboutUs.css';

const emptyTexto = { title: '', description: '' };

const AboutUs = () => {
  const [historiaTitulo, setHistoriaTitulo] = useState('');
  const [historia, setHistoria] = useState('');
  const [missionData, setMissionData] = useState(emptyTexto);
  const [visionData, setVisionData] = useState(emptyTexto);
  const [galleryData, setGalleryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerInformacionSobreNosotros()
      .then((info) => {
        if (!activo) return;

        setHistoriaTitulo(typeof info.historia?.title === 'string' ? info.historia.title.trim() : '');
        setHistoria(typeof info.historia?.description === 'string' ? info.historia.description.trim() : '');
        setMissionData({
          title: typeof info.mission?.title === 'string' ? info.mission.title.trim() : '',
          description: typeof info.mission?.description === 'string' ? info.mission.description.trim() : '',
        });
        setVisionData({
          title: typeof info.vision?.title === 'string' ? info.vision.title.trim() : '',
          description: typeof info.vision?.description === 'string' ? info.vision.description.trim() : '',
        });
        setGalleryData(Array.isArray(info.gallery) ? info.gallery.slice(0, 3) : []);
      })
      .catch((err) => {
        console.error('No se pudo cargar la informacion de sobre nosotros.', err);
        if (activo) {
          setLoadError(err?.message || 'No se pudo cargar la información de Sobre Nosotros.');
        }
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const galleryItems = galleryData.slice(0, 3);
  const hasHistoria = Boolean(historiaTitulo || historia);
  const hasMission = Boolean(missionData.title || missionData.description);
  const hasVision = Boolean(visionData.title || visionData.description);

  if (loading) {
    return (
      <PageLoading
        message="Cargando sobre nosotros..."
      />
    );
  }

  return (
    <main className="about-page">
      {loadError ? (
        <p className="about-page__load-error" role="status">
          No se pudo cargar todo el contenido. Revise que el backend esté encendido.
        </p>
      ) : null}
      {hasHistoria ? (
        <section className="about-page__intro" aria-labelledby="about-historia-title">
          {historiaTitulo ? (
            <h1 id="about-historia-title" className="about-page__title">
              {historiaTitulo}
            </h1>
          ) : null}
          {historia ? <p className="about-page__lead">{historia}</p> : null}
        </section>
      ) : null}

      {hasMission || hasVision ? (
        <section className="about-page__values" aria-label="Misión y visión">
          {hasMission ? (
            <article className="about-page__card">
              <Coffee className="about-page__icon" strokeWidth={1.35} aria-hidden="true" />
              {missionData.title ? <h2>{missionData.title}</h2> : null}
              {missionData.description ? <p>{missionData.description}</p> : null}
            </article>
          ) : null}

          {hasVision ? (
            <article className="about-page__card">
              <Eye className="about-page__icon" strokeWidth={1.35} aria-hidden="true" />
              {visionData.title ? <h2>{visionData.title}</h2> : null}
              {visionData.description ? <p>{visionData.description}</p> : null}
            </article>
          ) : null}
        </section>
      ) : null}

      {galleryItems.length > 0 ? (
        <section className="about-page__gallery" aria-label="Galería de fotos">
          <div className="about-page__gallery-grid">
            {galleryItems.map((item) => (
              <figure key={item.id} className="about-page__gallery-item">
                <OptimizedImage
                  src={item.image}
                  alt={item.title || 'Imagen de galería'}
                  width={800}
                  height={520}
                  className="about-page__gallery-media"
                />
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default AboutUs;
