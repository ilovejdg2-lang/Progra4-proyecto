import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__top">
                <div className="footer__brand">
                    <img src="/logoblancoyrojo.png" alt="Cafe UNA" className="footer__logo" />
                    <div className="footer__brand-copy">
                        <strong>Cafe UNA</strong>
                        <span>Frase</span>
                    </div>
                </div>

                <div className="footer__contact-list">
                    <div className="footer__contact-item">
                        <span className="footer__contact-icon" aria-hidden="true">☎</span>
                        <div className="footer__contact-text">
                            <span>8599-7693</span>
                            <a href="mailto:cafeuna@una.cr">cafeuna@una.cr</a>
                        </div>
                    </div>

                    <div className="footer__contact-item">
                        <span className="footer__contact-icon" aria-hidden="true">◎</span>
                        <div className="footer__contact-text">
                            <a href="https://www.instagram.com/cafeuna_/" target="_blank" rel="noreferrer">
                                Cafe UNA
                            </a>
                            <a href="https://www.instagram.com/cafeuna_/" target="_blank" rel="noreferrer">
                                @cafeuna_
                            </a>
                        </div>
                    </div>

                    <div className="footer__contact-item">
                        <span className="footer__contact-icon" aria-hidden="true">◷</span>
                        <div className="footer__contact-text">
                            <span>Lunes a viernes</span>
                            <span>8:00am - 4:00pm</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer__divider" />
            <div className="footer__bottom">
                <p className="footer__text">© 2026 Cafe UNA Todos los derechos reservados.</p>
            </div>
        </footer>
    )
}

export default Footer;
