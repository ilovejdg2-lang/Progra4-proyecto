import { useEffect, useState } from 'react';

import { Coffee, Eye } from 'lucide-react';



import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';

import { obtenerInformacion } from '../../services/informacionService';

import './AboutUs.css';



const historiaDefault =

  'CAFÉ-UNA nació de una obsesión silenciosa por la pureza del grano. En un mundo de ruido constante, buscamos crear un refugio donde el tiempo se mide en la caída lenta de un filtrado. Lo que comenzó como un pequeño tostadero artesanal se ha convertido en un santuario para quienes valoran la trazabilidad, la paciencia y la elegancia de lo esencial. Cada taza es el resultado de una búsqueda incansable por los micro-lotes más honestos de la región.';



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



const AboutUs = () => {

  const [historia, setHistoria] = useState(historiaDefault);

  const [missionData, setMissionData] = useState(missionDefault);

  const [visionData, setVisionData] = useState(visionDefault);

  const [galleryData, setGalleryData] = useState(galleryDefault);



  useEffect(() => {

    let activo = true;



    obtenerInformacion()

      .then((info) => {

        if (!activo) return;



        if (typeof info.historia === 'string' && info.historia.trim()) {

          setHistoria(info.historia.trim());

        }



        setMissionData({ ...missionDefault, ...(info.mission ?? {}) });

        setVisionData({ ...visionDefault, ...(info.vision ?? {}) });



        const gallery = Array.isArray(info.gallery) && info.gallery.length > 0 ? info.gallery : galleryDefault;

        setGalleryData(gallery.slice(0, 3));

      })

      .catch((err) => {

        console.error('No se pudo cargar la informacion de sobre nosotros.', err);

      });



    return () => {

      activo = false;

    };

  }, []);



  const galleryItems =

    galleryData.length >= 3 ? galleryData.slice(0, 3) : [...galleryData, ...galleryDefault].slice(0, 3);



  return (

    <main className="about-page">

      <section className="about-page__intro" aria-labelledby="about-historia-title">

        <h1 id="about-historia-title" className="about-page__title">

          Nuestra historia

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

        </div>

      </section>

    </main>

  );

};



export default AboutUs;

