import { useEffect, useState } from 'react';

import { obtenerInformacion } from '../../services/informacionService';
import './AboutUs.css';

const missionDefault = {
  title: "Mision",
  description: "Brindar a nuestros clientes cafe de excelencia, promoviendo la cultura cafetalera costarricense mediante productos de calidad, atencion calida y practicas sostenibles."
};

const visionDefault = {
  title: "Vision",
  description: "Ser reconocidos como una cafeteria lider en innovacion, calidad y compromiso ambiental, creando experiencias memorables para nuestros clientes."
};

const galleryDefault = [
  {
    id: 1,
    title: "Cafe Espresso",
    image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "Granos de Cafe",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "Latte Art",
    image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    title: "Ambiente de Cafeteria",
    image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80"
  }
];

const AboutUs = () => {
  const [missionData, setMissionData] = useState(null);
  const [visionData, setVisionData] = useState(null);
  const [galleryData, setGalleryData] = useState([]);

  useEffect(() => {
    let activo = true;

    obtenerInformacion()
      .then((info) => {
        if (!activo) return;

        setMissionData({ ...missionDefault, ...(info.mission ?? {}) });
        setVisionData({ ...visionDefault, ...(info.vision ?? {}) });
        setGalleryData(Array.isArray(info.gallery) && info.gallery.length > 0 ? info.gallery : galleryDefault);
      })
      .catch((err) => {
        console.error("No se pudo cargar la informacion de sobre nosotros.", err);
        if (!activo) return;
        setMissionData(missionDefault);
        setVisionData(visionDefault);
        setGalleryData(galleryDefault);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <main className="about-page">
      <section className="about-page__hero">
        <h1>Sobre nosotros</h1>
        <p>
          Cafe UNA es mas que una cafeteria. Somos una comunidad comprometida con la excelencia y la sostenibilidad.
        </p>
      </section>

      <section className="about-page__values">
        <article className="about-page__card about-page__card--mission">
          {missionData ? (
            <>
              <h2>{missionData.title}</h2>
              <p>{missionData.description}</p>
            </>
          ) : null}
        </article>

        <article className="about-page__card about-page__card--vision">
          {visionData ? (
            <>
              <h2>{visionData.title}</h2>
              <p>{visionData.description}</p>
            </>
          ) : null}
        </article>
      </section>

      <section className="about-page__gallery">
        <h2 className="about-page__gallery-title">Galeria</h2>
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
