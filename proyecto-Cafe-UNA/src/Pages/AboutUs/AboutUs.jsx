import { useEffect, useState } from 'react';

import { Coffee, Eye } from 'lucide-react';



import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import PageLoading from '../../Components/PageLoading/PageLoading';

import { obtenerInformacionSobreNosotros } from '../../services/informacionService';

import './AboutUs.css';



const historiaDefault =

  'En Café UNA, cada grano cuenta una historia de esfuerzo, respeto por la tierra y comercio justo. Trabajamos junto a productores locales para ofrecer café de alta calidad con impacto social real.';



const missionDefault = {

  title: 'Nuestra misión',

  description:

    'Elevar la experiencia del café de especialidad a través de procesos rigurosos y una estética que invite a la contemplación.',

};



const visionDefault = {

  title: 'Nuestra visión',

  description:

    'Ser el referente global de lujo silencioso en el mundo del café, preservando la artesanía en cada eslabón de la cadena.',

};



const galleryDefault = [

  {

    id: 1,

    title: 'Latte art',

    image:

      'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80',

  },

  {

    id: 2,

    title: 'Interior de cafetería',

    image:

      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',

  },

  {

    id: 3,

    title: 'Granos de café',

    image:

      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',

  },

];

function notifyRouteError(message) {
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('public-route-error', { detail: { pathname: '/AboutUs', message } }));
  }, 0);
}



const AboutUs = () => {

  const [historiaTitulo, setHistoriaTitulo] = useState('Nuestra historia');
  const [historia, setHistoria] = useState(historiaDefault);

  const [missionData, setMissionData] = useState(missionDefault);

  const [visionData, setVisionData] = useState(visionDefault);

  const [galleryData, setGalleryData] = useState(galleryDefault);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');



  useEffect(() => {

    let activo = true;



    obtenerInformacionSobreNosotros()

      .then((info) => {

        if (!activo) return;



        if (typeof info.historia?.title === 'string' && info.historia.title.trim()) {
          setHistoriaTitulo(info.historia.title.trim());
        }

        if (typeof info.historia?.description === 'string' && info.historia.description.trim()) {
          setHistoria(info.historia.description.trim());
        }



        setMissionData({ ...missionDefault, ...(info.mission ?? {}) });

        setVisionData({ ...visionDefault, ...(info.vision ?? {}) });



        const gallery = Array.isArray(info.gallery) ? info.gallery : [];
        setGalleryData(gallery.slice(0, 3));

      })

      .catch((err) => {

        console.error('No se pudo cargar la informacion de sobre nosotros.', err);
        if (activo) {
          const message = err?.message || 'No se pudo cargar la información de Sobre Nosotros.';
          setLoadError(message);
          notifyRouteError(message);
        }

      })
      .finally(() => {
        if (activo) setLoading(false);
      });



    return () => {

      activo = false;

    };

  }, []);



  const galleryItems = galleryData.slice(0, 3);

  useEffect(() => {
    if (!loading && !loadError) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('public-route-ready', { detail: { pathname: '/AboutUs' } }));
      }, 0);
    }
  }, [loadError, loading]);

  if (loading || loadError) {
    return (
      <PageLoading
        message={loadError || "Cargando sobre nosotros..."}
        detail={loadError ? "Revise que el backend esté encendido y vuelva a intentar." : ""}
        isError={Boolean(loadError)}
      />
    );
  }



  return (

    <main className="about-page">

      <section className="about-page__intro" aria-labelledby="about-historia-title">

        <h1 id="about-historia-title" className="about-page__title">

          {historiaTitulo}

        </h1>

        <p className="about-page__lead">{historia}</p>

      </section>



      <section className="about-page__values" aria-label="Misión y visión">

        <article className="about-page__card">

          <Coffee className="about-page__icon" strokeWidth={1.35} aria-hidden="true" />

          <h2>{missionData.title}</h2>

          <p>{missionData.description}</p>

        </article>



        <article className="about-page__card">

          <Eye className="about-page__icon" strokeWidth={1.35} aria-hidden="true" />

          <h2>{visionData.title}</h2>

          <p>{visionData.description}</p>

        </article>

      </section>



      <section className="about-page__gallery" aria-label="Galería de fotos">

        <div className="about-page__gallery-grid">

          {galleryItems.map((item) => (

            <figure key={item.id} className="about-page__gallery-item">

              <OptimizedImage

                src={item.image}

                alt={item.title}

                width={800}

                height={520}

                className="about-page__gallery-media"

              />

            </figure>

          ))}

          {galleryItems.length === 0 ? (
            <p className="about-page__gallery-empty">No hay imágenes en la galería todavía.</p>
          ) : null}

        </div>

      </section>

    </main>

  );

};



export default AboutUs;

