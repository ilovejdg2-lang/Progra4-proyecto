import { Link } from '@tanstack/react-router';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Hero from '../../Components/Hero/Hero';
import PageLoading from '../../Components/PageLoading/PageLoading';
import { useCachedPageData } from '../../hooks/useCachedPageData';
import { useHomeVisualReady } from '../../hooks/usePreloadImages';
import { contactSupportMessage, sanitizeUserFacingError } from '../../lib/formLimits';
import { fetchHomePageData } from '../../lib/homePageData';
import { collectHomeImageUrls } from '../../lib/homeImageUrls';
import { isPageInstantReady, markPageRevealed } from '../../lib/pageSessionState';
import { removeHomeInitialLoader, setHomePageLoading } from '../../lib/homePageLoading';
import { runHomeScrollWhenReady } from '../../lib/homeScrollTarget';
import { readPageCache, readStalePageCache } from '../../lib/pageDataCache';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { toGoogleMapsEmbedUrl } from '../../lib/googleMaps';
import './Home.css';

const CARD_VISUALS = {
  donaciones: {
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    accentColor: '#a7532d',
    accentBg: '#fff6f0',
    borderColor: '#efc4ad',
  },
  visitas: {
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    accentColor: '#286f54',
    accentBg: '#f0fbf6',
    borderColor: '#a9dec8',
  },
  voluntariado: {
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accentColor: '#67521d',
    accentBg: '#fff9eb',
    borderColor: '#dfc98d',
  },
};

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
  const aboutTeaser = data?.aboutTeaser ?? { title: '', description: '', image: '' };
  const featuredSection = data?.featuredSection ?? { title: '', description: '' };
  const iniciativasSection = data?.iniciativasSection ?? { eyebrow: '', title: '', description: '' };
  const locationSection = data?.locationSection ?? { eyebrow: '', title: '', description: '', linkUrl: '' };
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
    document.body.classList.toggle('home-hero-ready', isFullyVisible);
    return () => {
      document.body.classList.remove('home-hero-ready');
    };
  }, [isFullyVisible]);

  useEffect(() => {
    return runHomeScrollWhenReady(isFullyVisible);
  }, [isFullyVisible]);

  const aboutTeaserImageUrl = normalizeImageUrl(aboutTeaser.image, { width: 900 });
  const featuredProducts = useMemo(
    () => products
      .filter((product) => product.estado !== 'Deshabilitado' && product.esDestacado)
      .slice(0, 3),
    [products],
  );

  const iniciativasCards = useMemo(() => tarjetasInicio.map((tarjeta) => {
    const clave = (tarjeta.clave || '').toLowerCase();
    const visual = CARD_VISUALS[clave] || {};

    return {
      id: clave || tarjeta.clave,
      etiqueta: tarjeta.etiqueta,
      titulo: tarjeta.titulo,
      descripcion: tarjeta.descripcion,
      to: tarjeta.ruta || '',
      icono: visual.icono,
      accentColor: visual.accentColor,
      accentBg: visual.accentBg,
      borderColor: visual.borderColor,
    };
  }), [tarjetasInicio]);

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
      <div className={prepaintHero ? 'home-page--prepaint' : undefined} aria-hidden={prepaintHero}>
      <Hero data={hero} onBackgroundReady={handleHeroBackgroundReady} />
      {isFullyVisible ? (
      <main className="home-page">
        <section id="sobre-nosotros" className="home-page__mission-spotlight" aria-labelledby="about-teaser-title">
          <div className="mission-spotlight-shell">
            <article className="mission-spotlight-card">
              <h2 id="about-teaser-title" className="mission-spotlight-card__title">
                {aboutTeaser.title}
              </h2>

              <div className="mission-spotlight-card__body">
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

                <div className="mission-spotlight-card__content">
                  <p className="mission-spotlight-card__description">
                    {aboutTeaser.description}
                  </p>
                  <Link to="/AboutUs" className="mission-spotlight-card__link">
                    Conoce nuestra historia completa
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="productos" className="home-page__featured curated-collections">
          <header className="curated-collections__header">
            <h2 className="curated-collections__title">{featuredSection.title}</h2>
            <p className="curated-collections__intro">{featuredSection.description}</p>
          </header>

          {featuredProducts.length === 0 ? (
            <p className="curated-collections__empty">Aún no hay cafés destacados. Márcalos en el panel de productos.</p>
          ) : (
            <div
              className="curated-collections__grid"
              aria-label="Selección destacada de cafés"
            >
              {featuredProducts.map((p, idx) => (
                <article
                  key={p?.id ?? p?.nombre ?? `featured-${idx}`}
                  className={`curated-collections__card${idx === 1 ? ' curated-collections__card--offset' : ''}`}
                >
                  <Link to="/productos" className="curated-collections__card-link">
                    <img
                      src={normalizeImageUrl(p.imagen, { width: 800 }) || p.imagen}
                      alt={p.nombre || 'Café'}
                      loading="eager"
                      width="800"
                      height="1000"
                      referrerPolicy="no-referrer"
                    />
                    <div className="curated-collections__overlay" aria-hidden="true" />
                    <div className="curated-collections__content">
                      {p.peso ? (
                      <span className="curated-collections__pill">
                        {String(p.peso).toUpperCase()}
                      </span>
                      ) : null}
                      <h3>{p.nombre}</h3>
                      {p.descripcion ? <p>{p.descripcion}</p> : null}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          <footer className="curated-collections__footer">
            <Link to="/productos" className="curated-collections__cta">
              Conoce nuestro catálogo
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </footer>
        </section>

        <section id="iniciativas" className="home-page__iniciativas">
          <div className="iniciativas-header">
            <span className="iniciativas-eyebrow">{iniciativasSection.eyebrow}</span>
            <h2 className="iniciativas-titulo">
              {iniciativasSection.title}
              <br />
            </h2>
            <p className="iniciativas-subtitulo">
              {iniciativasSection.description}
            </p>
          </div>

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

                {card.to ? (
                  <Link to={card.to} className="iniciativa-card__btn">
                    Completar formulario
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <span className="iniciativa-card__btn iniciativa-card__btn--decorativo">
                    Completar formulario
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="home-page__location" aria-labelledby="location-title">
          <div className="location-card">
            <div className="location-card__copy">
              <span className="location-card__eyebrow">
                <MapPin size={16} strokeWidth={2.4} aria-hidden="true" />
                {locationSection.eyebrow}
              </span>
              <h2 id="location-title">{locationSection.title}</h2>
              <p>{locationSection.description}</p>
              {locationMapUrl ? (
                <a href={locationMapUrl} target="_blank" rel="noreferrer" className="location-card__button">
                  Ver en Google Maps
                  <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
                </a>
              ) : null}
            </div>

            {locationMapEmbedUrl ? (
            <div className="location-card__map">
              <iframe
                title="Mapa de ubicación"
                src={locationMapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-hidden="true"
              />
              {locationMapUrl ? (
              <a href={locationMapUrl} target="_blank" rel="noreferrer" className="location-card__map-link" aria-label="Abrir ubicacion en Google Maps" />
              ) : null}
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
