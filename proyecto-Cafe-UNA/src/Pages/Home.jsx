
import Hero from '../Components/Hero';
import './Home.css';

const Home = () => {
  return (
    <main className="home-page">
      <Hero />
      <section className="home-page__info">
        <div className="home-page__intro">
          <h2> EN PROCESO</h2>
        </div>
      </section>
    </main>
  );
};

export default Home;
