import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { isExternalHeroUrl, mapHero } from "../../lib/heroData";
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

  return text;
}

function HeroActionLink({ href, className, children }) {
  const target = href?.trim();
  if (!target) return null;

  if (isExternalHeroUrl(target)) {
    return (
      <a href={target} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link to={target} className={className}>
      {children}
    </Link>
  );
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

  const showPrimary = Boolean(hero.primaryButtonText && hero.primaryButtonUrl);
  const showSecondary = Boolean(hero.buttonText && hero.buttonUrl);
  const hasActions = showPrimary || showSecondary;

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
              {showPrimary ? (
                <HeroActionLink
                  href={hero.primaryButtonUrl}
                  className="hero__button hero__button--primary"
                >
                  {hero.primaryButtonText}
                </HeroActionLink>
              ) : null}
              {showSecondary ? (
                <HeroActionLink
                  href={hero.buttonUrl}
                  className="hero__button hero__button--secondary"
                >
                  {hero.buttonText}
                </HeroActionLink>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Hero;
