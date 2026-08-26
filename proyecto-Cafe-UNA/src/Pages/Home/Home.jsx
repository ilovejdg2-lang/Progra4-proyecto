import { ArrowRight, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Hero from '../../Components/Hero/Hero';
import PageLoading from '../../Components/PageLoading/PageLoading';
import { useCachedPageData } from '../../hooks/useCachedPageData';
import { useHomeVisualReady } from '../../hooks/usePreloadImages';
import { contactSupportMessage, sanitizeUserFacingError } from '../../lib/formLimits';
import { fetchHomePageData } from '../../lib/homePageData';
import { HomeActionLink } from '../../lib/homeActionLink';
import { collectHomeImageUrls } from '../../lib/homeImageUrls';
import { isPageInstantReady, markPageRevealed } from '../../lib/pageSessionState';
import { removeHomeInitialLoader, setHomePageLoading } from '../../lib/homePageLoading';
import { runHomeScrollWhenReady } from '../../lib/homeScrollTarget';
import { productoPuedeDestacarse } from '../../lib/productoDisponibilidad';
import { readPageCache, readStalePageCache } from '../../lib/pageDataCache';
import FeaturedCafesCarousel from '../../Components/FeaturedCafesCarousel/FeaturedCafesCarousel';
import { imagenPrincipalProducto } from '../../lib/productoImagenes';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { toGoogleMapsEmbedUrl } from '../../lib/googleMaps';
import { buildIniciativasCards } from '../../lib/iniciativasCards';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import './Home.css';

function getPreloadSource(pageStatus, data) {
  if (pageStatus === 'ready' && data) return data;
  if (pageStatus === 'loading') {
    return readPageCache('home') ?? readStalePageCache('home');
  }
  return null;
}

const Home = () => {
  const showLoadingGate = !isPageInstantReady('home');

  const loadHome = useCallback(() => fetchHomePageData(), []);
  const { data, status: pageStatus, error: loadError, reload } = useCachedPageData('home', loadHome);

  const hero = data?.hero ?? {};
  const aboutTeaser = data?.aboutTeaser ?? { title: '', description: '', image: '', linkUrl: '', linkText: '' };
  const featuredSection = data?.featuredSection ?? { title: '', description: '', linkUrl: '', linkText: '' };
  const iniciativasSection = data?.iniciativasSection ?? { eyebrow: '', title: '', description: '' };
  const locationSection = data?.locationSection ?? { eyebrow: '', title: '', description: '', image: '', linkUrl: '', linkText: '' };
  const locationMapUrl = locationSection.linkUrl?.trim() ?? '';
  const locationMapEmbedUrl = useMemo(
    () => toGoogleMapsEmbedUrl(locationMapUrl),
    [locationMapUrl],
  );
  const tarjetasInicio = data?.tarjetasInicio ?? [];
  const products = data?.products ?? [];

  const preloadSource = getPreloadSource(pageStatus, data);
  const imageUrls = useMemo(
    () => collectHomeImageUrls(preloadSource),
    [preloadSource],
  );

  const canPreloadVisuals = showLoadingGate
    && (pageStatus === 'ready' || (pageStatus === 'loading' && imageUrls.length > 0));
  const visualReady = useHomeVisualReady(imageUrls, canPreloadVisuals);
  const [paintReady, setPaintReady] = useState(!showLoadingGate);

  useEffect(() => {
    if (!showLoadingGate) {
      setPaintReady(true);
      return;
    }

    if (pageStatus !== 'ready' || !visualReady) {
      setPaintReady(false);
    }
  }, [showLoadingGate, pageStatus, visualReady]);

  const handleHeroBackgroundReady = useCallback(() => {
    setPaintReady(true);
  }, []);

  const isFullyVisible = showLoadingGate
    ? pageStatus === 'ready' && visualReady && paintReady
    : pageStatus === 'ready';

  const prepaintHero = showLoadingGate
    && pageStatus === 'ready'
    && visualReady
    && !paintReady;

  useLayoutEffect(() => {
    if (pageStatus === 'error') {
      setHomePageLoading(false);
      return undefined;
    }

    setHomePageLoading(showLoadingGate && !isFullyVisible);
  }, [isFullyVisible, pageStatus, showLoadingGate]);

  useEffect(() => {
    if (isFullyVisible) {
      removeHomeInitialLoader();
      markPageRevealed('home');
      setHomePageLoading(false);
    }
  }, [isFullyVisible]);

  useEffect(() => {
    return runHomeScrollWhenReady(isFullyVisible);
  }, [isFullyVisible]);

  useRevealOnScroll(isFullyVisible);

  const aboutTeaserImageUrl = normalizeImageUrl(aboutTeaser.image, { width: 900 });
  const locationImageUrl = normalizeImageUrl(locationSection.image, { width: 1200 });
  const featuredProducts = useMemo(
    () => products
      .filter((product) => product.esDestacado && productoPuedeDestacarse(product))
      .filter((product) => Boolean(imagenPrincipalProducto(product)))
      .slice(0, 3),
    [products],
  );

  const iniciativasCards = useMemo(() => buildIniciativasCards(tarjetasInicio), [tarjetasInicio]);

  if (pageStatus === 'error') {
    return createPortal(
      <PageLoading
        isError
        message={sanitizeUserFacingError(loadError) || 'No se pudo cargar el inicio.'}
        detail={contactSupportMessage()}
        onRetry={reload}
      />,
      document.body,
    );
  }

  if (!isFullyVisible && !prepaintHero) {
    return createPortal(
      <PageLoading
        message="Cargando inicio..."
      />,
      document.body,
    );
  }

  return (
    <>
      {showLoadingGate && !isFullyVisible ? createPortal(
        <PageLoading message="Cargando inicio..." />,
        document.body,
      ) : null}
      <div className={`home-shell site-canvas${prepaintHero ? ' home-page--prepaint' : ''}`} inert={prepaintHero || undefined}>
      <Hero data={hero} onBackgroundReady={handleHeroBackgroundReady} />
      {isFullyVisible ? (
      <main className="home-page">
        {(aboutTeaser.title || aboutTeaser.description || aboutTeaserImageUrl) ? (
        <section id="sobre-nosotros" className="home-page__mission-spotlight reveal-on-scroll" aria-labelledby="about-teaser-title">
          <div className="mission-spotlight-shell">
            <article className="mission-spotlight-card">
              <div className="mission-spotlight-card__body">
                <div className="mission-spotlight-card__content">
                  {aboutTeaser.title ? (
                    <h2 id="about-teaser-title" className="mission-spotlight-card__title">
                      {aboutTeaser.title}
                    </h2>
                  ) : null}
                  {aboutTeaser.description ? (
                    <p className="mission-spotlight-card__description">
                      {aboutTeaser.description}
                    </p>
                  ) : null}
                  {aboutTeaser.linkText && aboutTeaser.linkUrl ? (
                    <HomeActionLink href={aboutTeaser.linkUrl} className="mission-spotlight-card__button">
                      {aboutTeaser.linkText}
                    </HomeActionLink>
                  ) : null}
                </div>

                {aboutTeaserImageUrl ? (
                  <div className="mission-spotlight-card__media">
                    <img
                      src={aboutTeaserImageUrl}
                      alt=""
                      width={900}
                      height={600}
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}
              </div>
            </article>
          </div>
        </section>
        ) : null}

        {(featuredSection.title || featuredSection.description || featuredProducts.length > 0) ? (
        <section id="productos" className="home-page__featured featured-cafes-section reveal-on-scroll">
          {(featuredSection.title || featuredSection.description) ? (
          <header className="featured-cafes-section__header">
            {featuredSection.title ? (
              <h2 className="featured-cafes-section__title">{featuredSection.title}</h2>
            ) : null}
            {featuredSection.description ? (
              <p className="featured-cafes-section__intro">{featuredSection.description}</p>
            ) : null}
          </header>
          ) : null}

          {featuredProducts.length === 0 ? (
            <p className="featured-cafes-section__empty">{"A\u00fan no hay caf\u00e9s destacados. M\u00e1rcalos en el panel de productos."}</p>
          ) : (
            <FeaturedCafesCarousel products={featuredProducts} />
          )}

          {featuredSection.linkText && featuredSection.linkUrl ? (
          <footer className="featured-cafes-section__footer">
            <HomeActionLink href={featuredSection.linkUrl} className="featured-cafes-section__cta">
              {featuredSection.linkText}
              <ArrowRight size={18} aria-hidden="true" />
            </HomeActionLink>
          </footer>
          ) : null}
        </section>
        ) : null}

        <section id="iniciativas" className="home-page__iniciativas reveal-on-scroll">
          {iniciativasSection.title || iniciativasSection.description ? (
            <header className="curated-collections__header">
              {iniciativasSection.title ? (
                <h2 className="curated-collections__title">{iniciativasSection.title}</h2>
              ) : null}
              {iniciativasSection.description ? (
                <p className="curated-collections__intro">{iniciativasSection.description}</p>
              ) : null}
            </header>
          ) : null}

          <div className="iniciativas-grid">
            {iniciativasCards.map((card) => (
              <div
                key={card.id}
                className="iniciativa-card"
                style={{
                  '--accent': card.accentColor,
                  '--accent-bg': card.accentBg,
                  '--accent-border': card.borderColor,
                }}
              >
                <div className="iniciativa-card__top">
                  <div className="iniciativa-card__icono">{card.icono}</div>
                  <span className="iniciativa-card__etiqueta">{card.etiqueta}</span>
                </div>

                <div className="iniciativa-card__body">
                  <h3 className="iniciativa-card__titulo">{card.titulo}</h3>
                  <p className="iniciativa-card__desc">{card.descripcion}</p>
                </div>

                {card.textoBoton && card.ruta ? (
                  <HomeActionLink href={card.ruta} className="iniciativa-card__btn">
                    {card.textoBoton}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </HomeActionLink>
                ) : card.textoBoton ? (
                  <span className="iniciativa-card__btn iniciativa-card__btn--decorativo">
                    {card.textoBoton}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="home-page__location reveal-on-scroll" aria-labelledby="location-title">
          <div className="location-card">
            <div className="location-card__copy">
              {locationSection.title ? (
                <h2 id="location-title">{locationSection.title}</h2>
              ) : null}
              {locationSection.description ? (
                <p>{locationSection.description}</p>
              ) : null}
              {locationSection.linkText && locationSection.linkUrl ? (
                <HomeActionLink href={locationSection.linkUrl} className="location-card__button">
                  {locationSection.linkText}
                  <ExternalLink size={15} aria-hidden="true" />
                </HomeActionLink>
              ) : null}
            </div>

            {locationMapEmbedUrl ? (
              <div className="location-card__map">
                <iframe
                  title={"Mapa de ubicaci\u00f3n"}
                  src={locationMapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : locationImageUrl ? (
              <div className="location-card__media">
                <img
                  src={locationImageUrl}
                  alt=""
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}
          </div>
        </section>
      </main>
      ) : null}
      </div>
    </>
  );
};

export default Home;
