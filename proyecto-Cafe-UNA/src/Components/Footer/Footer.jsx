import { Link } from '@tanstack/react-router';
import { Mail, MapPin, Phone, Share2 } from 'lucide-react';
import './Footer.css';

const mapsUrl = 'https://www.google.com/maps/place/Finca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional/@10.0232398,-84.11705,17z/data=!4m14!1m7!3m6!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!2sFinca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7!3m5!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7?entry=ttu&g_ep=EgoyMDI2MDUyNS4wIKXMDSoASAFQAw%3D%3D';
const facebookUrl = 'https://www.facebook.com/p/Caf%C3%A9-UNA-100051575025767/';
const instagramUrl = 'https://www.instagram.com/cafeuna_/';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__top">
                <Link to="/" className="footer__brand" aria-label="Ir al inicio">
                    <img src="/logoblancoyrojo.png" alt="Cafe UNA" className="footer__logo" />
                    <div className="footer__brand-copy">
                        <strong>Cafe UNA</strong>
                        <span>Frase</span>
                    </div>
                </Link>

                <nav className="footer__column" aria-label="Explorar">
                    <h2>Explorar</h2>
                    <Link to="/AboutUs">Nuestra Historia</Link>
                    <Link to="/productos">Tienda Online</Link>
                    <Link to="/voluntariado/solicitar">Voluntariado</Link>
                    <Link to="/login">Mi Cuenta</Link>
                </nav>

                <section className="footer__column footer__contact" aria-label="Contacto">
                    <h2>Contacto</h2>
                    <a href="tel:+50685997693" className="footer__contact-item">
                        <Phone className="footer__contact-icon" aria-hidden="true" />
                        <span>8599-7693</span>
                    </a>
                    <a href="mailto:cafeuna@una.cr" className="footer__contact-item">
                        <Mail className="footer__contact-icon" aria-hidden="true" />
                        <span>cafeuna@una.cr</span>
                    </a>
                    <a href={facebookUrl} target="_blank" rel="noreferrer" className="footer__contact-item">
                        <Share2 className="footer__contact-icon" aria-hidden="true" />
                        <span>Facebook Cafe UNA</span>
                    </a>
                    <a href={instagramUrl} target="_blank" rel="noreferrer" className="footer__contact-item">
                        <Share2 className="footer__contact-icon" aria-hidden="true" />
                        <span>Instagram @cafeuna_</span>
                    </a>
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="footer__contact-item">
                        <MapPin className="footer__contact-icon" aria-hidden="true" />
                        <span>Finca Experimental Santa Lucia</span>
                    </a>
                </section>
            </div>

            <div className="footer__divider" />
            <div className="footer__bottom">
                <p className="footer__text">© 2026 Cafe UNA Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
