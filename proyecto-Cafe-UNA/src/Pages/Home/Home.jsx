import { Link } from '@tanstack/react-router';
import { ExternalLink, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import Hero from '../../Components/Hero/Hero';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { obtenerHero } from '../../services/informacionService';
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

const missionSpotlightDefault = {
  title: 'Conocé más sobre Café UNA',
  description:
    'Descubrí nuestra historia, propósito y el impacto que construimos junto a productores locales y la comunidad universitaria.',
};

const mapsUrl = 'https://www.google.com/maps/place/Finca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional/@10.0232398,-84.11705,17z/data=!4m14!1m7!3m6!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!2sFinca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7!3m5!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7?entry=ttu&g_ep=EgoyMDI2MDUyNS4wIKXMDSoASAFQAw%3D%3D';

const Home = () => {
  const [hero, setHero] = useState({});
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState(null);

  useEffect(() => {
    let activo = true;

    obtenerHero()
      .then((heroInfo) => {
        if (!activo) return;
        setHero(heroInfo ?? {});
        setHeroLoaded(true);
      })
      .catch((err) => {
        console.error("No se pudo cargar la informacion del hero.", err);
        if (activo) {
          setHeroLoaded(true);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerProductos()
      .then((products) => {
        if (!activo) return;

        const destacado = products.find((product) => product.estado !== 'Deshabilitado' && Number(product.stock) > 0)
          ?? products.find((product) => product.estado !== 'Deshabilitado')
          ?? products[0]
          ?? null;

        setFeaturedProduct(destacado);
      })
      .catch((err) => {
        console.error('No se pudo cargar el producto destacado.', err);
        if (activo) {
          setFeaturedProduct(null);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const href = normalizeImageUrl(hero.backgroundImage, { width: 1920 });
    if (!href) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [hero.backgroundImage]);

  useEffect(() => {
    if (sessionStorage.getItem("scrollToIniciativas")) {
      sessionStorage.removeItem("scrollToIniciativas");
      window.setTimeout(() => {
        document
          .getElementById("iniciativas")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, []);

  const heroHasContent = Boolean(
    hero?.backgroundImage || hero?.title || hero?.subtitle || hero?.buttonText
  );

  useEffect(() => {
    document.body.classList.toggle('home-hero-ready', heroLoaded && heroHasContent);
    return () => {
      document.body.classList.remove('home-hero-ready');
    };
  }, [heroLoaded, heroHasContent]);

  return (
    <>
      <Hero data={hero} />
      <main className="home-page">
        <section className="home-page__mission-spotlight" aria-labelledby="mission-spotlight-title">
          <div className="mission-spotlight-shell">
            <article className="mission-spotlight-card">
              <h2 id="mission-spotlight-title" className="mission-spotlight-card__title">
                {missionSpotlightDefault.title}
              </h2>

              <div className="mission-spotlight-card__body">
                <div className="mission-spotlight-card__media">
                  <img
                    src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80"
                    alt="Sobre Café UNA"
                    loading="lazy"
                  />
                </div>

                <div className="mission-spotlight-card__content">
                  <p className="mission-spotlight-card__description">
                    {missionSpotlightDefault.description}
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

        <section className="home-page__featured">
          <div className="featured-product__copy">
            <h2 className="featured-product__title">Descubrí nuestra selección de cafés</h2>
            <p className="featured-product__intro">
              Explorá todos nuestros productos y elegí el café que mejor encaje con tu gusto, tu rutina y tu forma de disfrutarlo.
            </p>
          </div>

          <article className="featured-product-card">
            {featuredProduct?.imagen ? (
              <img
                className="featured-product-card__image"
                src={featuredProduct.imagen}
                alt={featuredProduct.nombre || 'Producto destacado'}
              />
            ) : (
              <div className="featured-product-card__image featured-product-card__image--placeholder" aria-hidden="true" />
            )}

            <div className="featured-product-card__body">
              <div className="featured-product-card__header">
                <h3>{featuredProduct?.nombre || 'Café UNA'}</h3>
              </div>

              <p className="featured-product-card__desc">
                {featuredProduct?.descripcion || 'Seleccionamos un producto para mostrarte la calidad y variedad de nuestro catálogo.'}
              </p>

              <div className="featured-product-card__meta">
                <span><strong>Cantidad:</strong> {featuredProduct?.peso || 'Información no disponible'}</span>
                <span><strong>Precio:</strong> CRC {(featuredProduct?.precioNormal ?? 0).toLocaleString('es-CR')}</span>
                <span><strong>Stock:</strong> {featuredProduct?.stock ?? 0}</span>
              </div>

              <Link to="/productos" className="featured-product-card__button">
                Conoce nuestro catalogo
              </Link>
            </div>
          </article>
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
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="location-card__button">
                Ver en Google Maps
                <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
              </a>
            </div>

            <div className="location-card__map">
              <iframe
                title="Mapa de Finca Experimental Santa Lucia"
                src="https://www.google.com/maps?q=Finca%20Experimental%20Santa%20Lucia%20Universidad%20Nacional%20Heredia&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-hidden="true"
              />
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="location-card__map-link" aria-label="Abrir ubicacion en Google Maps" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
