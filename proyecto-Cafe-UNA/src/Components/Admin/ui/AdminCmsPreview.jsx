import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Coffee, ExternalLink, Eye, Mail, MapPin, Phone, ShoppingCart } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "../../Footer/SocialIcons";

import Hero from "../../Hero/Hero";
import Gallery from "../../Gallery/Gallery";
import { HomeActionLink } from "../../../lib/homeActionLink";
import { normalizeImageUrl } from "../../../lib/imageUtils";
import { productoPuedeDestacarse } from "../../../lib/productoDisponibilidad";
import { toGoogleMapsEmbedUrl } from "../../../lib/googleMaps";
import { obtenerProductos } from "../../../services/productosService";

import "../../../Pages/Home/Home.css";
import "../../../Pages/AboutUs/AboutUs.css";
import "../../Hero/Hero.css";
import "../../Gallery/Gallery.css";
import "../../Footer/Footer.css";
import "../../Navbar/Navbar.css";
import "./AdminCmsPreview.css";

import { buildIniciativasCards } from "../../../lib/iniciativasCards";

function useProductosDestacados(enabled) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    let activo = true;
    setLoading(true);

    obtenerProductos()
      .then((lista) => {
        if (!activo) return;

        const destacados = (Array.isArray(lista) ? lista : [])
          .filter((producto) => producto.esDestacado && productoPuedeDestacarse(producto))
          .filter((producto) => Boolean(normalizeImageUrl(producto.imagen, { width: 800 }) || producto.imagen))
          .slice(0, 3);

        setProducts(destacados);
      })
      .catch(() => {
        if (activo) setProducts([]);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [enabled]);

  return { products, loading };
}

function PreviewShell({ children, className = "" }) {
  return (
    <section className={`admin-cms-preview-panel ${className}`.trim()}>
      <div className="admin-cms-preview-panel__header">
        <span className="admin-cms-preview-panel__badge">Vista previa</span>
      </div>
      <div className="admin-cms-preview-shell">{children}</div>
    </section>
  );
}

function PreviewLiveFrame({ children, variant = "" }) {
  return (
    <div className={`admin-cms-preview-viewport ${variant}`.trim()}>
      <div className={`admin-cms-preview site-canvas ${variant}`.trim()}>
        {children}
      </div>
    </div>
  );
}

function PreviewHeroLive({ form }) {
  return (
    <PreviewLiveFrame variant="admin-cms-preview--hero">
      <div className="home-shell">
        <Hero data={form} onBackgroundReady={() => {}} />
      </div>
    </PreviewLiveFrame>
  );
}

function PreviewIniciativasGrid({ tarjetas = [] }) {
  const cards = buildIniciativasCards(tarjetas);

  if (!cards.length) {
    return <p className="curated-collections__empty">{"Las tarjetas del inicio aparecer\u00e1n aqu\u00ed."}</p>;
  }

  return (
    <div className="iniciativas-grid">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`iniciativa-card iniciativa-card--${card.id}`}
          style={{
            "--accent": card.accentColor,
            "--accent-bg": card.accentBg,
            "--accent-border": card.borderColor,
          }}
        >
          <div className="iniciativa-card__top">
            <div className="iniciativa-card__icono">{card.icono}</div>
            <span className="iniciativa-card__etiqueta">{card.etiqueta}</span>
          </div>

          <div className="iniciativa-card__body">
            <h3 className="iniciativa-card__titulo">{card.titulo}</h3>
            <p className="iniciativa-card__desc">{card.descripcion}</p>
          </div>

          {card.textoBoton && card.ruta ? (
            <HomeActionLink href={card.ruta} className="iniciativa-card__btn">
              {card.textoBoton}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </HomeActionLink>
          ) : card.textoBoton ? (
            <span className="iniciativa-card__btn iniciativa-card__btn--decorativo">
              {card.textoBoton}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PreviewFeaturedProducts({ products, loading }) {
  if (loading) {
    return <p className="curated-collections__empty">{"Cargando caf\u00e9s destacados..."}</p>;
  }

  if (!products.length) {
    return (
      <p className="curated-collections__empty">{"A\u00fan no hay caf\u00e9s destacados. M\u00e1rcalos en el panel de productos."}</p>
    );
  }

  return (
    <div className="curated-collections__carousel">
      <div
        className={`curated-collections__grid curated-collections__grid--count-${products.length}`}
        aria-label={"Selecci\u00f3n destacada de caf\u00e9s"}
        role="list"
      >
        {products.map((producto, idx) => (
          <article
            key={producto?.id ?? producto?.nombre ?? `featured-${idx}`}
            role="listitem"
            className={`curated-collections__card${
              products.length === 3 && idx === 1 ? " curated-collections__card--offset" : ""
            }`}
          >
            <HomeActionLink
              href={producto.id ? `/productos/${producto.id}` : ""}
              className="curated-collections__card-link"
            >
              <img
                src={normalizeImageUrl(producto.imagen, { width: 800 }) || producto.imagen}
                alt={producto.nombre || "Caf\u00e9"}
                loading="eager"
                width="800"
                height="1000"
                referrerPolicy="no-referrer"
              />
              <div className="curated-collections__overlay" aria-hidden="true" />
              <div className="curated-collections__content">
                {producto.peso ? (
                  <span className="curated-collections__pill">{String(producto.peso).toUpperCase()}</span>
                ) : null}
                <h3>{producto.nombre}</h3>
                {producto.descripcion ? <p>{producto.descripcion}</p> : null}
              </div>
            </HomeActionLink>
          </article>
        ))}
      </div>
    </div>
  );
}

function PreviewHomeSectionLive({ clave, form, tarjetasInicio = [] }) {
  const { products, loading } = useProductosDestacados(clave === "homeFeatured");

  const aboutTeaserImageUrl = normalizeImageUrl(form.image, { width: 900 });
  const locationMapUrl = form.linkUrl?.trim() ?? "";
  const locationMapEmbedUrl = useMemo(
    () => toGoogleMapsEmbedUrl(locationMapUrl),
    [locationMapUrl],
  );

  let section = null;

  if (clave === "homeSpotlight") {
    section = (
      <section className="home-page__mission-spotlight" aria-labelledby="preview-about-teaser-title">
        <div className="mission-spotlight-shell">
          <article className="mission-spotlight-card">
            {form.title ? (
              <h2 id="preview-about-teaser-title" className="mission-spotlight-card__title">
                {form.title}
              </h2>
            ) : null}

            <div className="mission-spotlight-card__body">
              {aboutTeaserImageUrl ? (
                <div className="mission-spotlight-card__media">
                  <img
                    src={aboutTeaserImageUrl}
                    alt=""
                    width={900}
                    height={600}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}

              <div className="mission-spotlight-card__content">
                {form.description ? (
                  <p className="mission-spotlight-card__description">{form.description}</p>
                ) : null}
                {form.linkText && form.linkUrl ? (
                  <HomeActionLink href={form.linkUrl} className="mission-spotlight-card__link">
                    {form.linkText}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </HomeActionLink>
                ) : null}
              </div>
            </div>
          </article>
        </div>
      </section>
    );
  } else if (clave === "homeFeatured") {
    section = (
      <section className="home-page__featured curated-collections">
        {(form.title || form.description) ? (
          <header className="curated-collections__header">
            {form.title ? <h2 className="curated-collections__title">{form.title}</h2> : null}
            {form.description ? <p className="curated-collections__intro">{form.description}</p> : null}
          </header>
        ) : null}

        <PreviewFeaturedProducts products={products} loading={loading} />

        {form.linkText && form.linkUrl ? (
          <footer className="curated-collections__footer">
            <HomeActionLink href={form.linkUrl} className="curated-collections__cta">
              {form.linkText}
              <ArrowRight size={18} aria-hidden="true" />
            </HomeActionLink>
          </footer>
        ) : null}
      </section>
    );
  } else if (clave === "homeIniciativas") {
    section = (
      <section className="home-page__iniciativas">
        {form.title || form.description ? (
          <header className="curated-collections__header">
            {form.title ? <h2 className="curated-collections__title">{form.title}</h2> : null}
            {form.description ? <p className="curated-collections__intro">{form.description}</p> : null}
          </header>
        ) : null}

        <PreviewIniciativasGrid tarjetas={tarjetasInicio} />
      </section>
    );
  } else if (clave === "homeLocation") {
    section = (
      <section className="home-page__location" aria-labelledby="preview-location-title">
        <div className="location-card">
          <div className="location-card__copy">
            {form.title ? <h2 id="preview-location-title">{form.title}</h2> : null}
            {form.description ? <p>{form.description}</p> : null}
            {locationMapUrl && form.linkText ? (
              <a href={locationMapUrl} target="_blank" rel="noreferrer" className="location-card__button">
                {form.linkText}
                <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
              </a>
            ) : null}
          </div>

          {locationMapEmbedUrl ? (
            <div className="location-card__map">
              <iframe
                title={"Mapa de ubicaci\u00f3n"}
                src={locationMapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <PreviewLiveFrame variant="admin-cms-preview--section">
      <div className="home-shell">
        <main className="home-page">{section}</main>
      </div>
    </PreviewLiveFrame>
  );
}

function PreviewTarjetasInicioLive({ tarjetas = [] }) {
  return (
    <PreviewLiveFrame variant="admin-cms-preview--section">
      <div className="home-shell">
        <main className="home-page">
          <section className="home-page__iniciativas">
            <PreviewIniciativasGrid tarjetas={tarjetas} />
          </section>
        </main>
      </div>
    </PreviewLiveFrame>
  );
}

function PreviewTextoInstitucionalLive({ form, tipo = "historia" }) {
  if (tipo === "historia") {
    return (
      <PreviewLiveFrame variant="admin-cms-preview--about">
        <main className="about-page">
          <section className="about-page__intro" aria-labelledby="preview-about-historia-title">
            {form.title ? (
              <h1 id="preview-about-historia-title" className="section-title about-page__title">
                {form.title}
              </h1>
            ) : null}
            {form.description ? <p className="about-page__lead">{form.description}</p> : null}
          </section>
        </main>
      </PreviewLiveFrame>
    );
  }

  const Icon = tipo === "vision" ? Eye : Coffee;

  return (
    <PreviewLiveFrame variant="admin-cms-preview--about">
      <main className="about-page">
        <section className="about-page__values" aria-label={tipo === "vision" ? "Visi\u00f3n" : "Misi\u00f3n"}>
          <article className="about-page__card">
            <Icon className="about-page__icon" strokeWidth={1.35} aria-hidden="true" />
            {form.title ? <h2>{form.title}</h2> : null}
            {form.description ? <p>{form.description}</p> : null}
          </article>
        </section>
      </main>
    </PreviewLiveFrame>
  );
}

function PreviewGaleriaLive({ items = [] }) {
  const galleryItems = items.filter((item) => item.image || item.title);

  if (!galleryItems.length) {
    return (
      <PreviewLiveFrame variant="admin-cms-preview--gallery">
        <main className="about-page">
          <p className="about-page__lead" style={{ textAlign: "center", opacity: 0.55 }}>{"Agreg\u00e1 fotos para ver la galer\u00eda."}</p>
        </main>
      </PreviewLiveFrame>
    );
  }

  return (
    <PreviewLiveFrame variant="admin-cms-preview--gallery">
      <main className="about-page">
        <Gallery items={galleryItems.slice(0, 4)} pageSize={4} />
      </main>
    </PreviewLiveFrame>
  );
}

function PreviewNavbarLive({ form, enlaces = [] }) {
  const [scrolled, setScrolled] = useState(false);
  const logoSrc = normalizeImageUrl(
    scrolled ? (form.logoUrl || form.logoClaroUrl) : (form.logoClaroUrl || form.logoUrl),
    { width: 320 },
  );
  const links = enlaces.filter((item) => item.etiqueta?.trim() || item.ruta?.trim()).slice(0, 5);

  return (
    <>
      <div className="admin-cms-preview-modes" role="tablist" aria-label="Estado del navbar">
        <button
          type="button"
          role="tab"
          aria-selected={!scrolled}
          className={!scrolled ? "is-active" : ""}
          onClick={() => setScrolled(false)}
        >
          Sin scroll
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scrolled}
          className={scrolled ? "is-active" : ""}
          onClick={() => setScrolled(true)}
        >
          Con scroll
        </button>
      </div>
      <PreviewLiveFrame variant={`admin-cms-preview--navbar${scrolled ? " admin-cms-preview--navbar-solid" : ""}`}>
        <header className={`navbar ${scrolled ? "navbar--solid" : "navbar--transparent"}`}>
          <div className="navbar__start">
            <span className="navbar__brand" aria-hidden="true">
              {logoSrc ? (
                <img src={logoSrc} alt="Logo navbar" className="navbar__brand-logo" width={160} height={52} decoding="async" />
              ) : (
                <span className="navbar__brand-logo navbar__brand-logo--placeholder" />
              )}
            </span>
          </div>

          <nav className="navbar__menu" aria-label="Vista previa de enlaces">
            {links.length ? links.map((item, index) => (
              <span key={item.id ?? index}>{item.etiqueta || "Enlace"}</span>
            )) : (
              <span style={{ opacity: 0.5 }}>{"Los enlaces aparecer\u00e1n aqu\u00ed."}</span>
            )}
          </nav>

          <div className="navbar__actions" aria-hidden="true">
            <span className="navbar__icon-button">
              <ShoppingCart size={24} strokeWidth={2} />
            </span>
          </div>
        </header>
      </PreviewLiveFrame>
    </>
  );
}

function PreviewFooterLive({ form, enlaces = [] }) {
  const footerLogoSrc = normalizeImageUrl(form.logoClaroUrl || form.logoUrl, { width: 480 });
  const explorar = enlaces.filter((item) => item.etiqueta?.trim() || item.ruta?.trim()).slice(0, 5);
  const hasContactos = Boolean(form.telefono || form.correo || form.mapsUrl);
  const hasSocial = Boolean(form.facebookUrl || form.instagramUrl);

  return (
    <PreviewLiveFrame variant="admin-cms-preview--footer">
      <footer className="footer">
        <div className="footer__top">
          <div className="footer__brand" aria-hidden="true">
            {footerLogoSrc ? (
              <img src={footerLogoSrc} alt="Café UNA" className="footer__logo" width={220} height={64} decoding="async" />
            ) : null}
            <div className="footer__brand-copy">
              {form.fraseMarca ? <span>{form.fraseMarca}</span> : null}
            </div>
          </div>

          <nav className="footer__column" aria-label="Explorar">
            <h2>Explorar</h2>
            {explorar.length ? explorar.map((item, index) => (
              <span key={item.id ?? index}>{item.etiqueta || "Enlace"}</span>
            )) : (
              <span style={{ opacity: 0.5 }}>{"Los enlaces aparecer\u00e1n aqu\u00ed."}</span>
            )}
          </nav>

          {hasContactos ? (
            <section className="footer__column footer__contact" aria-label="Contactos">
              <h2>Contactos</h2>
              {form.telefono ? (
                <span className="footer__contact-item">
                  <Phone className="footer__contact-icon" aria-hidden="true" />
                  <span>{form.telefono}</span>
                </span>
              ) : null}
              {form.correo ? (
                <span className="footer__contact-item">
                  <Mail className="footer__contact-icon" aria-hidden="true" />
                  <span>{form.correo}</span>
                </span>
              ) : null}
              {form.mapsUrl ? (
                <span className="footer__contact-item">
                  <MapPin className="footer__contact-icon" aria-hidden="true" />
                  <span>{"Ubicaci\u00f3n"}</span>
                </span>
              ) : null}
            </section>
          ) : null}

          {hasSocial ? (
            <section className="footer__column footer__social" aria-label="Redes sociales">
              <h2>Redes sociales</h2>
              <div className="footer__social-links">
                {form.instagramUrl ? (
                  <span aria-label="Instagram">
                    <InstagramIcon className="footer__social-icon" />
                  </span>
                ) : null}
                {form.facebookUrl ? (
                  <span aria-label="Facebook">
                    <FacebookIcon className="footer__social-icon" />
                  </span>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="footer__divider" />
        <div className="footer__bottom">
          {form.textoCopyright ? <p className="footer__text">{form.textoCopyright}</p> : null}
        </div>
      </footer>
    </PreviewLiveFrame>
  );
}

function PreviewEnlaces({ items = [] }) {
  const enlaces = items.filter((item) => item.etiqueta?.trim() || item.ruta?.trim());

  if (!enlaces.length) {
    return (
      <PreviewLiveFrame variant="admin-cms-preview--navbar">
        <header className="navbar navbar--solid">
          <div className="navbar__menu">
            <span style={{ opacity: 0.5 }}>{"Los enlaces aparecer\u00e1n aqu\u00ed."}</span>
          </div>
        </header>
      </PreviewLiveFrame>
    );
  }

  return (
    <PreviewLiveFrame variant="admin-cms-preview--navbar">
      <header className="navbar navbar--solid" aria-label="Vista previa de enlaces">
        <div className="navbar__menu">
          {enlaces.map((item, index) => (
            <span key={item.id ?? index}>{item.etiqueta || "Sin etiqueta"}</span>
          ))}
        </div>
      </header>
    </PreviewLiveFrame>
  );
}

export function AdminEditorConPreview({ preview, children, ayuda }) {
  return (
    <div className="admin-cms-editor">
      <PreviewShell>{preview}</PreviewShell>

      <section className="admin-cms-editor__form-section">
        <div className="admin-cms-editor__form-header">
          <h3 className="admin-cms-editor__form-title">{"Edici\u00f3n"}</h3>
        </div>
        {ayuda ? <p className="admin-cms-editor__ayuda">{ayuda}</p> : null}
        <div className="admin-cms-editor__fields">{children}</div>
      </section>
    </div>
  );
}

export {
  PreviewShell,
  PreviewHeroLive,
  PreviewHomeSectionLive,
  PreviewTarjetasInicioLive,
  PreviewTextoInstitucionalLive,
  PreviewGaleriaLive,
  PreviewNavbarLive,
  PreviewFooterLive,
  PreviewEnlaces,
};
