import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Mail, MapPin, Phone } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from './SocialIcons';
import SiteNavLink from '../SiteNavLink/SiteNavLink';
import { useHomeBrandNavigation } from '../../hooks/useHomeBrandNavigation';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { obtenerEnlaces, obtenerFooter } from '../../services/informacionService';
import './Footer.css';

function telefonoHref(telefono) {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('506') ? `tel:+${digits}` : `tel:+506${digits}`;
}

const Footer = () => {
  const onBrandClick = useHomeBrandNavigation();
  const [footer, setFooter] = useState(null);
  const [enlacesExplorar, setEnlacesExplorar] = useState([]);

  useEffect(() => {
    let activo = true;

    Promise.all([
      obtenerFooter().catch(() => null),
      obtenerEnlaces('FooterExplorar').catch(() => []),
    ]).then(([footerData, enlaces]) => {
      if (!activo) return;
      setFooter(footerData);
      setEnlacesExplorar(Array.isArray(enlaces) ? enlaces : []);
    });

    return () => {
      activo = false;
    };
  }, []);

  const telHref = telefonoHref(footer?.telefono);
  const footerLogoSrc = normalizeImageUrl(footer?.logoClaroUrl || footer?.logoUrl, { width: 480 });
  const explorarLinks = enlacesExplorar;
  const hasContactos = Boolean(telHref || footer?.correo || footer?.mapsUrl);
  const hasSocial = Boolean(footer?.facebookUrl || footer?.instagramUrl);

  return (
    <footer className="footer">
      <div className="footer__top">
        <Link
          to="/"
          className="footer__brand"
          aria-label="Ir al inicio"
          onClick={onBrandClick}
        >
          {footerLogoSrc ? (
            <img
              src={footerLogoSrc}
              alt="Café UNA"
              className="footer__logo"
              width={220}
              height={64}
              decoding="async"
            />
          ) : null}
          <div className="footer__brand-copy">
            {footer?.fraseMarca ? <span>{footer.fraseMarca}</span> : null}
          </div>
        </Link>

        {explorarLinks.length > 0 ? (
        <nav className="footer__column" aria-label="Explorar">
          <h2>Explorar</h2>
          {explorarLinks.map((enlace) => (
            <SiteNavLink key={enlace.id ?? enlace.ruta} enlace={enlace} />
          ))}
        </nav>
        ) : null}

        {hasContactos ? (
          <section className="footer__column footer__contact" aria-label="Contactos">
            <h2>Contactos</h2>
            {telHref ? (
              <a href={telHref} className="footer__contact-item">
                <Phone className="footer__contact-icon" aria-hidden="true" />
                <span>{footer.telefono}</span>
              </a>
            ) : null}
            {footer?.correo ? (
              <a href={`mailto:${footer.correo}`} className="footer__contact-item">
                <Mail className="footer__contact-icon" aria-hidden="true" />
                <span>{footer.correo}</span>
              </a>
            ) : null}
            {footer?.mapsUrl ? (
              <a href={footer.mapsUrl} target="_blank" rel="noreferrer" className="footer__contact-item">
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
              {footer?.instagramUrl ? (
                <a href={footer.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <InstagramIcon className="footer__social-icon" />
                </a>
              ) : null}
              {footer?.facebookUrl ? (
                <a href={footer.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <FacebookIcon className="footer__social-icon" />
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <div className="footer__divider" />
      <div className="footer__bottom">
        {footer?.textoCopyright ? (
          <p className="footer__text">{footer.textoCopyright}</p>
        ) : null}
      </div>
    </footer>
  );
};

export default Footer;
