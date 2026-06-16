import { Link } from '@tanstack/react-router';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import Hero from '../../Components/Hero/Hero';
import PageLoading from '../../Components/PageLoading/PageLoading';
import { contactSupportMessage, sanitizeUserFacingError } from '../../lib/formLimits';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { obtenerHero, obtenerSeccion, obtenerTarjetasInicio } from '../../services/informacionService';
import { obtenerProductos } from '../../services/productosServices';
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
    to: '/voluntariado/solicitar',
  },
};

const COLLECTION_LABELS = ['ORIGEN', 'EXPERIENCIA', 'ARTESANÍA'];

const mapsEmbedUrl =
  'https://www.google.com/maps?q=Finca%20Experimental%20Santa%20Lucia%20Universidad%20Nacional%20Heredia&output=embed';

function waitForImage(src, timeoutMs = 8000) {
  if (!src) return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    const timeoutId = window.setTimeout(resolve, timeoutMs);
    const done = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };

    image.onload = done;
    image.onerror = done;
    image.src = src;
  });
}


const Home = () => {
  const [hero, setHero] = useState({});
  const [pageStatus, setPageStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [aboutTeaser, setAboutTeaser] = useState({ title: '', description: '', image: '' });
  const [featuredSection, setFeaturedSection] = useState({ title: '', description: '' });
  const [iniciativasSection, setIniciativasSection] = useState({ eyebrow: '', title: '', description: '' });
  const [locationSection, setLocationSection] = useState({ eyebrow: '', title: '', description: '', linkUrl: '' });
  const [tarjetasInicio, setTarjetasInicio] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let activo = true;

    async function cargarInicio() {
      setPageStatus('loading');
      setLoadError('');

      try {
        const [
          heroInfo,
          spotlight,
          featured,
          iniciativas,
          location,
          tarjetas,
          productList,
        ] = await Promise.all([
          obtenerHero(),
          obtenerSeccion('homeSpotlight'),
          obtenerSeccion('homeFeatured'),
          obtenerSeccion('homeIniciativas'),
          obtenerSeccion('homeLocation'),
          obtenerTarjetasInicio(),
          obtenerProductos().catch(() => []),
        ]);

        if (!activo) return;

        const nextHero = heroInfo ?? {};
        const backgroundUrl = normalizeImageUrl(nextHero.backgroundImage, { width: 1920 });
        await waitForImage(backgroundUrl);

        if (!activo) return;

        setHero(nextHero);
        setAboutTeaser({
          title: typeof spotlight?.title === 'string' ? spotlight.title.trim() : '',
          description: typeof spotlight?.description === 'string' ? spotlight.description.trim() : '',
          image: typeof spotlight?.image === 'string' ? spotlight.image.trim() : '',
        });
        setFeaturedSection({
          title: typeof featured?.title === 'string' ? featured.title.trim() : '',
          description: typeof featured?.description === 'string' ? featured.description.trim() : '',
        });
        setIniciativasSection({
          eyebrow: typeof iniciativas?.eyebrow === 'string' ? iniciativas.eyebrow.trim() : '',
          title: typeof iniciativas?.title === 'string' ? iniciativas.title.trim() : '',
          description: typeof iniciativas?.description === 'string' ? iniciativas.description.trim() : '',
        });
        setLocationSection({
          eyebrow: typeof location?.eyebrow === 'string' ? location.eyebrow.trim() : '',
          title: typeof location?.title === 'string' ? location.title.trim() : '',
          description: typeof location?.description === 'string' ? location.description.trim() : '',
          linkUrl:
            typeof location?.linkUrl === 'string'
              ? location.linkUrl.trim()
              : typeof location?.LinkUrl === 'string'
                ? location.LinkUrl.trim()
                : '',
        });
        setTarjetasInicio(
          Array.isArray(tarjetas)
            ? tarjetas.map((item) => ({
                clave: item.clave || item.Clave || '',
                etiqueta: item.etiqueta || item.Etiqueta || '',
                titulo: item.titulo || item.Titulo || '',
                descripcion: item.descripcion || item.Descripcion || '',
                ruta: item.ruta || item.Ruta || '',
              }))
            : [],
        );
        setProducts(Array.isArray(productList) ? productList : []);
        setPageStatus('ready');
      } catch (err) {
        console.error('No se pudo cargar la página de inicio.', err);
        if (!activo) return;
        setLoadError(sanitizeUserFacingError(err?.message || 'No se pudo cargar el inicio.'));
        setPageStatus('error');
      }
    }

    cargarInicio();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const href = normalizeImageUrl(hero.backgroundImage, { width: 1920 });
    if (!href) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [hero.backgroundImage]);

  useEffect(() => {
    if (sessionStorage.getItem('scrollToIniciativas')) {
      sessionStorage.removeItem('scrollToIniciativas');
      window.setTimeout(() => {
        document.getElementById('iniciativas')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, []);

  const aboutTeaserImageUrl = normalizeImageUrl(aboutTeaser.image, { width: 900 });
  const featuredProducts = products
    .filter((product) => product.estado !== 'Deshabilitado' && product.esDestacado)
    .slice(0, 3);

  const iniciativasCards = tarjetasInicio.map((tarjeta) => {
    const clave = (tarjeta.clave || '').toLowerCase();
    const visual = CARD_VISUALS[clave] || {};

    return {
      id: clave || tarjeta.clave,
      etiqueta: tarjeta.etiqueta,
      titulo: tarjeta.titulo,
      descripcion: tarjeta.descripcion,
      to: tarjeta.ruta || visual.to || '',
      icono: visual.icono,
      accentColor: visual.accentColor,
      accentBg: visual.accentBg,
      borderColor: visual.borderColor,
    };
  });

  useEffect(() => {
    document.body.classList.toggle('home-hero-ready', pageStatus === 'ready');
    return () => {
      document.body.classList.remove('home-hero-ready');
    };
  }, [pageStatus]);

  if (pageStatus === 'loading') {
    return (
      <PageLoading
        message="Cargando inicio..."
      />
    );
  }

  if (pageStatus === 'error') {
    return (
      <PageLoading
        isError
        message={loadError || 'No se pudo cargar el inicio.'}
        detail={contactSupportMessage()}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      <Hero data={hero} />
      <main className="home-page">
        <section className="home-page__mission-spotlight" aria-labelledby="about-teaser-title">
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
                      loading="lazy"
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

        <section className="home-page__featured curated-collections">
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
                      loading="lazy"
                      width="800"
                      height="1000"
                    />
                    <div className="curated-collections__overlay" aria-hidden="true" />
                    <div className="curated-collections__content">
                      <span className="curated-collections__pill">
                        {p.peso ? String(p.peso).toUpperCase() : COLLECTION_LABELS[idx % COLLECTION_LABELS.length]}
                      </span>
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
              {locationSection.linkUrl ? (
                <a href={locationSection.linkUrl} target="_blank" rel="noreferrer" className="location-card__button">
                  Ver en Google Maps
                  <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
                </a>
              ) : null}
            </div>

            <div className="location-card__map">
              <iframe
                title="Mapa de Finca Experimental Santa Lucia"
                src={mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-hidden="true"
              />
              {locationSection.linkUrl ? (
                <a href={locationSection.linkUrl} target="_blank" rel="noreferrer" className="location-card__map-link" aria-label="Abrir ubicacion en Google Maps" />
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
