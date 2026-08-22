import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { normalizePathname } from '../../lib/paths';
import {
  clearHomeScrollTarget,
  navigateToHomeSection,
  resolveHomeSectionFromRoute,
  scrollToHomeSection,
} from '../../lib/homeScrollTarget';

function esRutaExterna(ruta) {
  return /^https?:\/\//i.test(String(ruta || ''));
}

function scrollHomeSectionAfterMenuClose(sectionId) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      scrollToHomeSection(sectionId);
    });
  });
}

const SiteNavLink = ({ enlace, className, activeProps, children, onClick }) => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const etiqueta = children ?? enlace?.etiqueta;
  const ruta = enlace?.ruta;
  const homeSection = resolveHomeSectionFromRoute(ruta);

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

  const handleClick = (event) => {
    onClick?.(event);

    if (!homeSection) {
      return;
    }

    event.preventDefault();

    if (normalizePathname(pathname) === '/') {
      clearHomeScrollTarget();
      scrollHomeSectionAfterMenuClose(homeSection);
      return;
    }

    navigateToHomeSection(navigate, homeSection);
  };

  return (
    <Link
      to={homeSection ? '/' : ruta}
      className={className}
      activeProps={activeProps}
      onClick={handleClick}
    >
      {etiqueta}
    </Link>
  );
};

export default SiteNavLink;
