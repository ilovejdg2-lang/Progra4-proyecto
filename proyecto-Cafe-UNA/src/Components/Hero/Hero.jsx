import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { mapHero } from "../../lib/heroData";
import "./Hero.css";

function renderHeroTitle(title) {
  const text = title?.trim();
  if (!text) return null;

  if (text.includes("\n")) {
    const [lineOne, ...rest] = text.split("\n");
    const lineTwo = rest.join(" ").trim();
    if (!lineTwo) return text;

    return (
      <>
        <span className="hero__title-line hero__title-line--first">{lineOne.trim()}</span>
        <br className="hero__title-break" aria-hidden="true" />
        <span className="hero__title-line hero__title-line--second">{lineTwo}</span>
      </>
    );
  }

  const marker = " el universitario";
  const markerIndex = text.toLowerCase().lastIndexOf(marker);
  if (markerIndex > 0) {
    return (
      <>
        <span className="hero__title-line hero__title-line--first">{text.slice(0, markerIndex).trim()}</span>
        <br className="hero__title-break" aria-hidden="true" />
        <span className="hero__title-line hero__title-line--second">{text.slice(markerIndex).trim()}</span>
      </>
    );
  }

  return text;
}

const Hero = ({ data = {}, onBackgroundReady }) => {
  const hero = mapHero(data);
  const backgroundUrl = normalizeImageUrl(hero.backgroundImage, { width: 1920 });
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
      if (typeof event.currentTarget.decode === "function") {
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

  const hasActions = Boolean(hero.primaryButtonText || hero.buttonText);

  return (
    <section id="hero" className={`hero${bgReady ? " hero--bg-ready" : ""}`}>
      {backgroundUrl ? (
        <div className="hero__media" aria-hidden="true">
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
            onLoad={handleBackgroundLoad}
            onError={handleBackgroundError}
          />
          <div className="hero__overlay" />
        </div>
      ) : null}

      <div className="hero__inner">
        <div className="hero__copy">
          {hero.eyebrow ? <p className="hero__eyebrow">{hero.eyebrow}</p> : null}
          {hero.title ? <h1 className="hero__title">{renderHeroTitle(hero.title)}</h1> : null}
          {hero.subtitle ? <p className="hero__text">{hero.subtitle}</p> : null}

          {hasActions ? (
            <div className="hero__actions">
              {hero.primaryButtonText ? (
                <Link to="/Products" className="hero__button hero__button--primary">
                  {hero.primaryButtonText}
                </Link>
              ) : null}
              {hero.buttonText ? (
                <Link to="/AboutUs" className="hero__button hero__button--secondary">
                  {hero.buttonText}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Hero;
