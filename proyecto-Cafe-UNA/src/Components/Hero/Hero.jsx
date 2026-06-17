import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeImageUrl } from "../../lib/imageUtils";
import "./Hero.css";

const Hero = ({ data = {}, onBackgroundReady }) => {
  const backgroundUrl = normalizeImageUrl(data?.backgroundImage, { width: 1920 });
  const [bgReady, setBgReady] = useState(!backgroundUrl);
  const imgRef = useRef(null);

  const notifyReady = useCallback(() => {
    setBgReady(true);
    onBackgroundReady?.();
  }, [onBackgroundReady]);

  useEffect(() => {
    setBgReady(!backgroundUrl);
    if (!backgroundUrl) {
      onBackgroundReady?.();
      return;
    }

    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      notifyReady();
    }
  }, [backgroundUrl, notifyReady, onBackgroundReady]);

  const handleBackgroundLoad = async (event) => {
    try {
      if (typeof event.currentTarget.decode === 'function') {
        await event.currentTarget.decode();
      }
    } catch {
      // ignore
    }
    notifyReady();
  };

  const handleBackgroundError = () => {
    notifyReady();
  };

  return (
    <section id="hero" className={`hero${bgReady ? ' hero--bg-ready' : ''}`}>
      {backgroundUrl ? (
        <img
          ref={imgRef}
          key={backgroundUrl}
          src={backgroundUrl}
          alt=""
          className="hero__bg"
          width={1920}
          height={1080}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          referrerPolicy="no-referrer"
          aria-hidden="true"
          onLoad={handleBackgroundLoad}
          onError={handleBackgroundError}
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
