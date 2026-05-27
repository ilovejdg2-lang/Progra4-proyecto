import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { normalizeImageUrl } from "../../lib/imageUtils";
import "./Hero.css";

const Hero = ({ data = {} }) => {
  const backgroundUrl = normalizeImageUrl(data?.backgroundImage, { width: 1920 });
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
      {backgroundUrl ? <div className="hero__overlay" aria-hidden="true" /> : null}
      <div className="hero__copy">
        {data?.title ? <h1 className="hero__title">{data.title}</h1> : null}
        {data?.subtitle ? <p className="hero__text">{data.subtitle}</p> : null}
        {data?.buttonText ? (
          <Link to="/AboutUs" className="hero__button">
            {data.buttonText}
          </Link>
        ) : null}
      </div>
    </section>
  );
};

export default Hero;
