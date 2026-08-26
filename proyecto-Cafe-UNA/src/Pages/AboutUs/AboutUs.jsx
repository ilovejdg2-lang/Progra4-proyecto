import Gallery from '../../Components/Gallery/Gallery';
import { AboutNarrativeBlock } from '../../Components/AboutNarrativeBlock/AboutNarrativeBlock';
import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
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

  const hasHistoria = Boolean(historiaTitulo || historia || data?.historiaImage || data?.historiaEyebrow);
  const hasMission = Boolean(missionData.title || missionData.description || missionData.image || missionData.eyebrow);
  const hasVision = Boolean(visionData.title || visionData.description || visionData.image || visionData.eyebrow);
  const pageReady = !showLoading && !isError;

  useRevealOnScroll(pageReady, '.about-page');

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={isError}
      error={loadError}
      errorMessage={"No se pudo cargar la informaci\u00f3n de Sobre Nosotros."}
      onRetry={reload}
    >
      <main className="about-page site-canvas">
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.about} />
        {!hasHistoria ? (
          <h1 className="about-page__title about-page__title--sr">Sobre nosotros</h1>
        ) : null}
        <section className="about-page__narratives" aria-label="Nuestra historia, misión y visión">
          {hasHistoria ? (
            <AboutNarrativeBlock
              className="reveal-on-scroll"
              eyebrow={data?.historiaEyebrow}
              title={historiaTitulo}
              description={historia}
              image={data?.historiaImage}
            />
          ) : null}
          {hasMission ? (
            <AboutNarrativeBlock
              className="reveal-on-scroll"
              eyebrow={missionData.eyebrow}
              title={missionData.title}
              description={missionData.description}
              image={missionData.image}
              reverse
            />
          ) : null}
          {hasVision ? (
            <AboutNarrativeBlock
              className="reveal-on-scroll"
              eyebrow={visionData.eyebrow}
              title={visionData.title}
              description={visionData.description}
              image={visionData.image}
            />
          ) : null}
        </section>
        {galleryItems.length > 0 ? (
          <div className="reveal-on-scroll">
            <Gallery items={galleryItems} pageSize={10} />
          </div>
        ) : null}
      </main>
    </PublicPageGate>
  );
};

export default AboutUs;
