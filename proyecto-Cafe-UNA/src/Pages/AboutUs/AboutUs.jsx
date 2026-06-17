import { Coffee, Eye } from 'lucide-react';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { fetchAboutPageData } from '../../lib/aboutPageData';
import './AboutUs.css';

const AboutUs = () => {
  const {
    data,
    showLoading,
    isError,
    error: loadError,
    reload,
    loadingMessage,
  } = useCachedPublicPage('about', fetchAboutPageData);

  const historiaTitulo = data?.historiaTitulo ?? '';
  const historia = data?.historia ?? '';
  const missionData = data?.missionData ?? { title: '', description: '' };
  const visionData = data?.visionData ?? { title: '', description: '' };
  const galleryItems = data?.galleryData ?? [];

  const hasHistoria = Boolean(historiaTitulo || historia);
  const hasMission = Boolean(missionData.title || missionData.description);
  const hasVision = Boolean(visionData.title || visionData.description);

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={isError}
      error={loadError}
      errorMessage="No se pudo cargar la información de Sobre Nosotros."
      onRetry={reload}
    >
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
    </PublicPageGate>
  );
};

export default AboutUs;
