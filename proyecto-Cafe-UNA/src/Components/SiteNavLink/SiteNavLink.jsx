import { Link } from '@tanstack/react-router';

function esRutaExterna(ruta) {
  return /^https?:\/\//i.test(String(ruta || ''));
}

const SiteNavLink = ({ enlace, className, activeProps, children, onClick }) => {
  const etiqueta = children ?? enlace?.etiqueta;
  const ruta = enlace?.ruta;

  if (!ruta) {
    return null;
  }

  if (esRutaExterna(ruta)) {
    return (
      <a
        href={ruta}
        className={className}
        onClick={onClick}
        target={enlace.abrirEnNuevaPestana ? '_blank' : undefined}
        rel={enlace.abrirEnNuevaPestana ? 'noreferrer' : undefined}
      >
        {etiqueta}
      </a>
    );
  }

  return (
    <Link to={ruta} className={className} activeProps={activeProps} onClick={onClick}>
      {etiqueta}
    </Link>
  );
};

export default SiteNavLink;
