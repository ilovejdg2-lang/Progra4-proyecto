import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { normalizeImageUrl } from "../../lib/imageUtils";
import "./Hero.css";

const defaultData = {
  title: "Bienvenidos a Café UNA",
  subtitle: "Disfruta del mejor café artesanal cultivado con pasión y tradición costarricense.",
  buttonText: "Conocer más",
  backgroundImage:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1920&q=80",
};

const Hero = ({ data = {} }) => {
  const heroData = { ...defaultData, ...data };
  const backgroundUrl = normalizeImageUrl(heroData.backgroundImage, { width: 1920 });
  const [bgReady, setBgReady] = useState(!backgroundUrl);

  return (
    <section className={`hero ${bgReady ? "hero--ready" : ""}`}>
      {backgroundUrl ? (
        <img
          key={backgroundUrl}
          src={backgroundUrl}
          alt=""
          className="hero__bg"
          width={1920}
          height={1080}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setBgReady(true)}
          onError={() => setBgReady(true)}
          aria-hidden="true"
        />
      ) : null}
      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__copy">
        <h1 className="hero__title">{heroData.title}</h1>
        <p className="hero__text">{heroData.subtitle}</p>
        {heroData.buttonText ? (
          <Link to="/AboutUs" className="hero__button">
            {heroData.buttonText}
          </Link>
        ) : null}
      </div>
    </section>
  );
};

export default Hero;
