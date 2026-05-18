import './Hero.css';

const Hero = ({ data = {} }) => {
    const defaultData = {
        title: "Bienvenidos a Café UNA",
        subtitle: "Disfruta del mejor café artesanal cultivado con pasión y tradición costarricense.",
        buttonText: "Conocer más",
        backgroundImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"
    };
    
    const heroData = { ...defaultData, ...data };
    
    return (
        <section className="hero" style={heroData.backgroundImage ? { backgroundImage: `url(${heroData.backgroundImage})` } : {}}>
            <div className="hero__overlay"></div>
            <div className="hero__copy">
                <h1 className="hero__title">{heroData.title}</h1>
                <p className="hero__text">
                   {heroData.subtitle}
                </p>
                {heroData.buttonText && (
                    <button className="hero__button">{heroData.buttonText}</button>
                )}
            </div>
        </section>
    )
}

export default Hero;
