import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Mail, MapPin, Phone } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from './SocialIcons';
import SiteNavLink from '../SiteNavLink/SiteNavLink';
import { useHomeBrandNavigation } from '../../hooks/useHomeBrandNavigation';
import { normalizeImageUrl } from '../../lib/imageUtils';
import { obtenerEnlaces, obtenerFooter } from '../../services/informacionService';
import { useIdioma } from '../../lib/useIdioma';
import { useTraducir } from '../../hooks/useTraducir';
import './Footer.css';

function telefonoHref(telefono) {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('506') ? `tel:+${digits}` : `tel:+506${digits}`;
}

const Footer = () => {
  const { idioma } = useIdioma();
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
  }, [idioma]);

  const fraseMarca = useTraducir(
    footer?.fraseMarca ?? footer?.FraseMarca ?? '',
  );
  const textoCopyright = useTraducir(
    footer?.textoCopyright ?? footer?.TextoCopyright ?? '',
  );

  const labelExplorar = useTraducir('Explorar');
  const labelContactos = useTraducir('Contactos');
  const labelRedes = useTraducir('Redes sociales');
  const labelUbicacion = useTraducir('Ubicación');
  const labelInicio = useTraducir('Ir al inicio');

  const telHref = telefonoHref(footer?.telefono ?? footer?.Telefono);
  const footerLogoSrc = normalizeImageUrl(
    footer?.logoClaroUrl || footer?.LogoClaroUrl || footer?.logoUrl || footer?.LogoUrl,
    { width: 480 },
  );
  const explorarLinks = enlacesExplorar;
  const hasContactos = Boolean(
    telHref || footer?.correo || footer?.Correo || footer?.mapsUrl || footer?.MapsUrl,
  );
  const hasSocial = Boolean(
    footer?.facebookUrl || footer?.FacebookUrl || footer?.instagramUrl || footer?.InstagramUrl,
  );

  return (
    <footer className="footer">
      <div className="footer__top">
        <Link
          to="/"
          className="footer__brand"
          aria-label={labelInicio}
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
            {fraseMarca ? <span>{fraseMarca}</span> : null}
          </div>
        </Link>

        {explorarLinks.length > 0 ? (
          <nav className="footer__column" aria-label={labelExplorar}>
            <h2>{labelExplorar}</h2>
            {explorarLinks.map((enlace) => (
              <SiteNavLink key={enlace.id ?? enlace.ruta} enlace={enlace} />
            ))}
          </nav>
        ) : null}

        {hasContactos ? (
          <section className="footer__column footer__contact" aria-label={labelContactos}>
            <h2>{labelContactos}</h2>
            {telHref ? (
              <a href={telHref} className="footer__contact-item">
                <Phone className="footer__contact-icon" aria-hidden="true" />
                <span>{footer.telefono ?? footer.Telefono}</span>
              </a>
            ) : null}
            {(footer?.correo || footer?.Correo) ? (
              <a
                href={`mailto:${footer.correo ?? footer.Correo}`}
                className="footer__contact-item"
              >
                <Mail className="footer__contact-icon" aria-hidden="true" />
                <span>{footer.correo ?? footer.Correo}</span>
              </a>
            ) : null}
            {(footer?.mapsUrl || footer?.MapsUrl) ? (
              <a
                href={footer.mapsUrl ?? footer.MapsUrl}
                target="_blank"
                rel="noreferrer"
                className="footer__contact-item"
              >
                <MapPin className="footer__contact-icon" aria-hidden="true" />
                <span>{labelUbicacion}</span>
              </a>
            ) : null}
          </section>
        ) : null}

        {hasSocial ? (
          <section className="footer__column footer__social" aria-label={labelRedes}>
            <h2>{labelRedes}</h2>
            <div className="footer__social-links">
              {(footer?.instagramUrl || footer?.InstagramUrl) ? (
                <a
                  href={footer.instagramUrl ?? footer.InstagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="footer__social-icon" />
                </a>
              ) : null}
              {(footer?.facebookUrl || footer?.FacebookUrl) ? (
                <a
                  href={footer.facebookUrl ?? footer.FacebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="footer__social-icon" />
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <div className="footer__divider" />
      <div className="footer__bottom">
        {textoCopyright ? <p className="footer__text">{textoCopyright}</p> : null}
      </div>
    </footer>
  );
};

export default Footer;
