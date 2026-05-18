
import './AboutUs.css';

const AboutUs = () => {
  const missionData = {
    title: "Misión",
    description: "Brindar a nuestros clientes café de excelencia, promoviendo la cultura cafetalera costarricense mediante productos de calidad, atención cálida y prácticas sostenibles."
  };

  const visionData = {
    title: "Visión",
    description: "Ser reconocidos como una cafetería líder en innovación, calidad y compromiso ambiental, creando experiencias memorables para nuestros clientes."
  };

  const galleryData = [
    {
      id: 1,
      title: "Café Espresso",
      image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Granos de Café",
      image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Latte Art",
      image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "Ambiente de Cafetería",
      image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <main className="about-page">
      <section className="about-page__hero">
        <h1>Sobre nosotros</h1>
        <p>
          Café UNA es más que una cafetería. Somos una comunidad comprometida con la excelencia y la sostenibilidad.
        </p>
      </section>

      <section className="about-page__values">
        <article className="about-page__card about-page__card--mission">
          <h2>{missionData.title}</h2>
          <p>{missionData.description}</p>
        </article>

        <article className="about-page__card about-page__card--vision">
          <h2>{visionData.title}</h2>
          <p>{visionData.description}</p>
        </article>
      </section>

      <section className="about-page__gallery">
        <h2 className="about-page__gallery-title">Galería</h2>
        <div className="about-page__gallery-grid">
          {galleryData.map((item) => (
            <div key={item.id} className="about-page__gallery-item">
              <img src={item.image} alt={item.title} />
              <h3>{item.title}</h3>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default AboutUs;
