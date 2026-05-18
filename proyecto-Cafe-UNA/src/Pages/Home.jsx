import { Link } from '@tanstack/react-router';
import Hero from '../Components/Hero';
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

const heroData = {
  title: "Bienvenidos a Café UNA",
  subtitle: "Disfruta del mejor café artesanal cultivado con pasión y tradición costarricense.",
  buttonText: "Conocer más",
  backgroundImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"
};

const Home = () => {
  return (
    <main className="home-page">
      <Hero data={heroData} />
      <section className="home-page__info">
        <div className="home-page__intro">
          <h2>Bienvenido a Café UNA</h2>
          <p>Disfruta del mejor café artesanal cultivado con pasión y tradición costarricense</p>
        </div>
      </section>

      <section className="home-page__iniciativas">
        <div className="iniciativas-header">
          <span className="iniciativas-eyebrow">Participá con nosotros</span>
          <h2 className="iniciativas-titulo">
            Cada aporte, visita o colaboración
            <br />
            <em>deja una huella especial.</em>
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
    </main>
  );
};

export default Home;
