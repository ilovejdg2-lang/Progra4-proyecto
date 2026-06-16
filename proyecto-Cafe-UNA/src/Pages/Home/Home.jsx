import { Link } from '@tanstack/react-router';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import Hero from '../../Components/Hero/Hero';
import PageLoading from '../../Components/PageLoading/PageLoading';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { obtenerFooter, obtenerHero, obtenerSeccion } from '../../services/informacionService';
import { obtenerProductos } from '../../services/productosServices';
import './Home.css';

const cards = [
  {
    id: 'donaciones',
    etiqueta: 'Donaciones',
    titulo: 'Cada aporte transforma una vida',
    descripcion:
      'Tu contribución financia iniciativas sostenibles, investigaciones y programas de bienestar que impactan a toda la comunidad universitaria.',
    icono: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    accentColor: '#a7532d',
    accentBg: '#fff6f0',
    borderColor: '#efc4ad',
  },
  {
    id: 'visitas',
    etiqueta: 'Visitas',
    titulo: 'Conocé el corazón del proyecto',
    descripcion:
      'Agendá una visita guiada a nuestras instalaciones y viví de cerca la experiencia del Café UNA, sus cultivos y su gente.',
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
  {
    id: 'voluntariado',
    to: '/voluntariado/solicitar',
    etiqueta: 'Voluntariado',
    titulo: 'Sumá tu energía a nuestra misión',
    descripcion:
      'Formá parte del equipo de voluntarios que sostiene las actividades del Café UNA. Tu tiempo y dedicación dejan huella.',
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
];

const COLLECTION_LABELS = ['ORIGEN', 'EXPERIENCIA', 'ARTESANÍA'];

const featuredIntroDefault =
  'Explorá todos nuestros productos y elegí el café que mejor encaje con tu gusto, tu rutina y tu forma de disfrutarlo.';

const aboutTeaserDefault = {
  title: 'Conocé más sobre Café UNA',
  description:
    'Descubrí nuestra historia, propósito y el impacto que construimos junto a productores locales y la comunidad universitaria.',
  image:
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
};

const mapsUrlDefault =
  'https://www.google.com/maps/place/Finca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional/@10.0232398,-84.11705,17z/data=!4m14!1m7!3m6!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!2sFinca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7!3m5!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7?entry=ttu&g_ep=EgoyMDI2MDUyNS4wIKXMDSoASAFQAw%3D%3D';

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
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [aboutTeaser, setAboutTeaser] = useState({ title: '', description: '', image: '' });
  const [mapsUrl, setMapsUrl] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let activo = true;

    obtenerHero()
      .then(async (heroInfo) => {
        if (!activo) return;
        const nextHero = heroInfo ?? {};
        const backgroundUrl = normalizeImageUrl(nextHero.backgroundImage, { width: 1920 });

        await waitForImage(backgroundUrl);
        if (!activo) return;

        setHero(nextHero);
        setHeroLoaded(true);
      })
      .catch((err) => {
        console.error('No se pudo cargar la informacion del hero.', err);
        if (activo) {
          setHero({});
          setHeroLoaded(true);
          setLoadError(err?.message || '');
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    Promise.all([
      obtenerSeccion('homeSpotlight').catch(() => ({})),
      obtenerFooter().catch(() => null),
    ]).then(([spotlight, footer]) => {
      if (!activo) return;

      setAboutTeaser({
        title: typeof spotlight?.title === 'string' ? spotlight.title.trim() : '',
        description: typeof spotlight?.description === 'string' ? spotlight.description.trim() : '',
        image: typeof spotlight?.image === 'string' ? spotlight.image.trim() : '',
      });
      setMapsUrl(typeof footer?.mapsUrl === 'string' ? footer.mapsUrl.trim() : '');
    });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerProductos()
      .then((list) => {
        if (!activo) return;
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('No se pudo cargar los productos para la galería.', err);
        if (activo) {
          setProducts([]);
        }
      })
      .finally(() => {
        if (activo) setLoadingProducts(false);
      });

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

  const heroHasContent = Boolean(
    hero?.backgroundImage || hero?.title || hero?.subtitle || hero?.buttonText
  );
  const homeReady = heroLoaded;
  const aboutTeaserTitle = aboutTeaser.title || aboutTeaserDefault.title;
  const aboutTeaserDescription = aboutTeaser.description || aboutTeaserDefault.description;
  const aboutTeaserImageUrl = normalizeImageUrl(
    aboutTeaser.image || aboutTeaserDefault.image,
    { width: 900 },
  );
  const activeMapsUrl = mapsUrl || mapsUrlDefault;
  const featuredProducts = products.filter((product) => product.estado !== 'Deshabilitado');

  useEffect(() => {
    document.body.classList.toggle('home-hero-ready', heroLoaded);
    return () => {
      document.body.classList.remove('home-hero-ready');
    };
  }, [heroLoaded]);

  if (!homeReady) {
    return (
      <PageLoading
        message="Cargando inicio..."
      />
    );
  }

  return (
    <>
      {loadError ? (
        <p className="home-page__load-error" role="status">
          Algunos datos del inicio no se pudieron cargar. Puede seguir navegando el sitio.
        </p>
      ) : null}
      <Hero data={hero} />
      <main className="home-page">
        <section className="home-page__mission-spotlight" aria-labelledby="about-teaser-title">
          <div className="mission-spotlight-shell">
            <article className="mission-spotlight-card">
              <h2 id="about-teaser-title" className="mission-spotlight-card__title">
                {aboutTeaserTitle}
              </h2>

              <div className="mission-spotlight-card__body">
                <div className="mission-spotlight-card__media">
                  <img
                    src={aboutTeaserImageUrl}
                    alt=""
                    loading="lazy"
                  />
                </div>

                <div className="mission-spotlight-card__content">
                  <p className="mission-spotlight-card__description">
                    {aboutTeaserDescription}
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
            <h2 className="curated-collections__title">Descubrí nuestra selección de cafés</h2>
            <p className="curated-collections__intro">{featuredIntroDefault}</p>
          </header>

          {!loadingProducts && featuredProducts.length === 0 ? (
            <p className="curated-collections__empty">Pronto tendremos nuevos cafés disponibles.</p>
          ) : (
            <div
              className="curated-collections__grid"
              aria-busy={loadingProducts}
              aria-label="Selección destacada de cafés"
            >
              {(loadingProducts ? Array.from({ length: 3 }) : featuredProducts.slice(0, 3)).map((p, idx) => (
                <article
                  key={p?.id ?? p?.nombre ?? `placeholder-${idx}`}
                  className={`curated-collections__card${idx === 1 ? ' curated-collections__card--offset' : ''}${p ? '' : ' curated-collections__card--loading'}`}
                >
                  {p ? (
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
                  ) : (
                    <div className="curated-collections__skeleton" aria-hidden="true" />
                  )}
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
            <span className="iniciativas-eyebrow">Participá con nosotros</span>
            <h2 className="iniciativas-titulo">
              Cada aporte, visita o colaboración deja una huella especial.
              <br />
            </h2>
            <p className="iniciativas-subtitulo">
              Elegí cómo querés involucrarte con el Café UNA y completá el formulario correspondiente.
            </p>
          </div>

          <div className="iniciativas-grid">
            {cards.map((card) => (
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
                Nuestra ubicacion
              </span>
              <h2 id="location-title">Visitanos en la Finca Experimental Santa Lucia</h2>
              <p>
                Estamos en Heredia, Barva. Abrilo en Google Maps para ver la ruta y llegar con facilidad.
              </p>
              <a href={activeMapsUrl} target="_blank" rel="noreferrer" className="location-card__button">
                Ver en Google Maps
                <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
              </a>
            </div>

            <div className="location-card__map">
              <iframe
                title="Mapa de Finca Experimental Santa Lucia"
                src={mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-hidden="true"
              />
              <a href={activeMapsUrl} target="_blank" rel="noreferrer" className="location-card__map-link" aria-label="Abrir ubicacion en Google Maps" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
