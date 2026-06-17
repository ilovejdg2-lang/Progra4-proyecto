import { useCallback } from 'react';
import { Coffee, Eye } from 'lucide-react';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import BackToHomeLink, { HOME_SCROLL_SECTIONS } from '../../Components/BackToHomeLink/BackToHomeLink';
import PageLoading from '../../Components/PageLoading/PageLoading';
import { usePublicPageLoadingGate } from '../../hooks/usePublicPageLoadingGate';
import { useCachedPageData } from '../../hooks/useCachedPageData';
import { contactSupportMessage, sanitizeUserFacingError } from '../../lib/formLimits';
import { fetchAboutPageData } from '../../lib/aboutPageData';
import './AboutUs.css';

const AboutUs = () => {
  const loadAbout = useCallback(() => fetchAboutPageData(), []);
  const { data, status, error: loadError, reload } = useCachedPageData('about', loadAbout);
  const showLoading = usePublicPageLoadingGate('about', status === 'ready');

  const historiaTitulo = data?.historiaTitulo ?? '';
  const historia = data?.historia ?? '';
  const missionData = data?.missionData ?? { title: '', description: '' };
  const visionData = data?.visionData ?? { title: '', description: '' };
  const galleryItems = data?.galleryData ?? [];

  const hasHistoria = Boolean(historiaTitulo || historia);
  const hasMission = Boolean(missionData.title || missionData.description);
  const hasVision = Boolean(visionData.title || visionData.description);

  if (showLoading) {
    return (
      <PageLoading
        message="Cargando sobre nosotros..."
      />
    );
  }

  if (status === 'error') {
    return (
      <PageLoading
        isError
        message={sanitizeUserFacingError(loadError) || 'No se pudo cargar la información de Sobre Nosotros.'}
        detail={contactSupportMessage()}
        onRetry={reload}
      />
    );
  }

  return (
    <main className="about-page">
      <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.about} />
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
