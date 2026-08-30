import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Mail, MapPin, Phone, ShoppingCart, User } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "../../Footer/SocialIcons";
import { adminBtnVoluntariadoCancel, adminBtnVoluntariadoPrimary } from "./AdminModal";

import Hero from "../../Hero/Hero";
import Gallery from "../../Gallery/Gallery";
import SiteNavLink from "../../SiteNavLink/SiteNavLink";
import { AboutNarrativeBlock } from "../../AboutNarrativeBlock/AboutNarrativeBlock";
import { HomeActionLink } from "../../../lib/homeActionLink";
import { normalizeImageUrl } from "../../../lib/imageUtils";
import { productoPuedeDestacarse } from "../../../lib/productoDisponibilidad";
import { toGoogleMapsEmbedUrl } from "../../../lib/googleMaps";
import FeaturedCafesCarousel from "../../FeaturedCafesCarousel/FeaturedCafesCarousel";
import { imagenPrincipalProducto } from "../../../lib/productoImagenes";
import { obtenerProductos } from "../../../services/productosService";

import "../../../Pages/Home/Home.css";
import "../../../Pages/AboutUs/AboutUs.css";
import "../../Hero/Hero.css";
import "../../Gallery/Gallery.css";
import "../../Footer/Footer.css";
import "../../Navbar/Navbar.css";
import "./AdminCmsPreview.css";

import { useTraducir } from "../../../hooks/useTraducir";
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
          .filter((producto) => Boolean(imagenPrincipalProducto(producto)))
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

function enlaceTieneContenido(item) {
  return Boolean(String(item?.etiqueta ?? "").trim() || String(item?.ruta ?? "").trim());
}

function enlacesNavbarParaPreview(enlaces = []) {
  return enlaces.filter((item) => {
    if (!enlaceTieneContenido(item)) return false;
    return String(item?.ruta ?? "").trim() !== "/";
  });
}

function PreviewNavItem({ item }) {
  if (item?.ruta) {
    return <SiteNavLink enlace={item} />;
  }

  return <span>{item?.etiqueta || "Enlace"}</span>;
}

function PreviewNavbarActions() {
  return (
    <div className="navbar__actions" aria-hidden="true">
      <span className="navbar__icon-button navbar__cart-button">
        <ShoppingCart size={24} strokeWidth={2} />
      </span>
      <span className="navbar__icon-button navbar__user-button">
        <User size={24} strokeWidth={2} />
      </span>
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
    <div className="featured-cafes-section featured-cafes-section--preview">
      <FeaturedCafesCarousel products={products} />
    </div>
  );
}

function PreviewHomeSectionLive({ clave, form, tarjetasInicio = [] }) {
  const { products, loading } = useProductosDestacados(clave === "homeFeatured");

  const aboutTeaserImageUrl = normalizeImageUrl(form.image, { width: 900 });
  const locationImageUrl = normalizeImageUrl(form.image, { width: 1200 });
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
            <div className="mission-spotlight-card__body">
              <div className="mission-spotlight-card__content">
                {form.title ? (
                  <h2 id="preview-about-teaser-title" className="mission-spotlight-card__title">
                    {form.title}
                  </h2>
                ) : null}
                {form.description ? (
                  <p className="mission-spotlight-card__description">{form.description}</p>
                ) : null}
                {form.linkText && form.linkUrl ? (
                  <HomeActionLink href={form.linkUrl} className="mission-spotlight-card__button">
                    {form.linkText}
                  </HomeActionLink>
                ) : null}
              </div>

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
            </div>
          </article>
        </div>
      </section>
    );
  } else if (clave === "homeFeatured") {
    section = (
      <section className="home-page__featured featured-cafes-section">
        {(form.title || form.description) ? (
          <header className="featured-cafes-section__header">
            {form.title ? <h2 className="featured-cafes-section__title">{form.title}</h2> : null}
            {form.description ? <p className="featured-cafes-section__intro">{form.description}</p> : null}
          </header>
        ) : null}

        <PreviewFeaturedProducts products={products} loading={loading} />

        {form.linkText && form.linkUrl ? (
          <footer className="featured-cafes-section__footer">
            <HomeActionLink href={form.linkUrl} className="featured-cafes-section__cta">
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
            {form.linkText && form.linkUrl ? (
              <HomeActionLink href={form.linkUrl} className="location-card__button">
                {form.linkText}
                <ExternalLink size={15} aria-hidden="true" />
              </HomeActionLink>
            ) : null}
          </div>

          {locationMapEmbedUrl ? (
            <div className="location-card__map">
              <iframe
                title={"Mapa de ubicaci\u00f3n"}
                src={locationMapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : locationImageUrl ? (
            <div className="location-card__media">
              <img
                src={locationImageUrl}
                alt=""
                width={1200}
                height={900}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
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
  return (
    <PreviewLiveFrame variant="admin-cms-preview--about">
      <main className="about-page">
        <section className="about-page__narratives">
          <AboutNarrativeBlock
            eyebrow={form.eyebrow}
            title={form.title}
            description={form.description}
            image={form.image}
            reverse={tipo === "mission"}
          />
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
        <Gallery items={galleryItems} pageSize={10} permitirLightbox={false} />
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
  const links = enlacesNavbarParaPreview(enlaces);

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
        <nav className={`navbar ${scrolled ? "navbar--solid" : "navbar--transparent"}`}>
          <div className="navbar__start">
            <span className="navbar__brand" aria-hidden="true">
              {logoSrc ? (
                <img src={logoSrc} alt="Logo navbar" className="navbar__brand-logo" width={160} height={52} decoding="async" />
              ) : (
                <span className="navbar__brand-logo navbar__brand-logo--placeholder" />
              )}
            </span>
          </div>

          <div className="navbar__menu" aria-label="Vista previa de enlaces">
            {links.length ? links.map((item, index) => (
              <PreviewNavItem key={item.id ?? index} item={item} />
            )) : (
              <span style={{ opacity: 0.5 }}>{"Los enlaces aparecer\u00e1n aqu\u00ed."}</span>
            )}
          </div>

          <PreviewNavbarActions />
        </nav>
      </PreviewLiveFrame>
    </>
  );
}

function PreviewFooterLive({ form, enlaces = [] }) {
  const footerLogoSrc = normalizeImageUrl(form.logoClaroUrl || form.logoUrl, { width: 480 });
  const explorar = enlaces.filter(enlaceTieneContenido);
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

          {explorar.length ? (
            <nav className="footer__column" aria-label="Explorar">
              <h2>Explorar</h2>
              {explorar.map((item, index) => (
                <PreviewNavItem key={item.id ?? index} item={item} />
              ))}
            </nav>
          ) : null}

          {hasContactos ? (
            <section className="footer__column footer__contact" aria-label="Contactos">
              <h2>Contactos</h2>
              {form.telefono ? (
                <a href={`tel:${form.telefono}`} className="footer__contact-item">
                  <Phone className="footer__contact-icon" aria-hidden="true" />
                  <span>{form.telefono}</span>
                </a>
              ) : null}
              {form.correo ? (
                <a href={`mailto:${form.correo}`} className="footer__contact-item">
                  <Mail className="footer__contact-icon" aria-hidden="true" />
                  <span>{form.correo}</span>
                </a>
              ) : null}
              {form.mapsUrl ? (
                <a href={form.mapsUrl} className="footer__contact-item">
                  <MapPin className="footer__contact-icon" aria-hidden="true" />
                  <span>{"Ubicaci\u00f3n"}</span>
                </a>
              ) : null}
            </section>
          ) : null}

          {hasSocial ? (
            <section className="footer__column footer__social" aria-label="Redes sociales">
              <h2>Redes sociales</h2>
              <div className="footer__social-links">
                {form.instagramUrl ? (
                  <a href={form.instagramUrl} aria-label="Instagram">
                    <InstagramIcon className="footer__social-icon" />
                  </a>
                ) : null}
                {form.facebookUrl ? (
                  <a href={form.facebookUrl} aria-label="Facebook">
                    <FacebookIcon className="footer__social-icon" />
                  </a>
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

function PreviewEnlaces({ items = [], variante = "navbar", navbar, footer }) {
  if (variante === "footer") {
    return <PreviewFooterLive form={footer ?? {}} enlaces={items} />;
  }

  return <PreviewNavbarLive form={navbar ?? {}} enlaces={items} />;
}

export function AdminEditorConPreview({ preview, children, ayuda }) {
  const [mostrandoVistaPrevia, setMostrandoVistaPrevia] = useState(false);
  const tVolver = useTraducir("Volver a edición");
  const tEdicion = useTraducir("Edición");
  const tPrevisualizar = useTraducir("Previsualizar");
  const tAyuda = useTraducir(ayuda || "");

  return (
    <div className="admin-cms-editor">
      {mostrandoVistaPrevia ? (
        <section className="admin-cms-editor__preview-section">
          <PreviewShell>{preview}</PreviewShell>
          <button
            type="button"
            onClick={() => setMostrandoVistaPrevia(false)}
            className={adminBtnVoluntariadoCancel}
          >
            {tVolver}
          </button>
        </section>
      ) : null}

      <section className="admin-cms-editor__form-section">
        <div className="admin-cms-editor__form-header">
          <h3 className="admin-cms-editor__form-title">{tEdicion}</h3>
          <button
            type="button"
            onClick={() => setMostrandoVistaPrevia(true)}
            className={adminBtnVoluntariadoPrimary}
          >
            {tPrevisualizar}
          </button>
        </div>
        {ayuda ? <p className="admin-cms-editor__ayuda">{tAyuda}</p> : null}
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
