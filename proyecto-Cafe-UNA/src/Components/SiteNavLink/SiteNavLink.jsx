import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { normalizePathname } from '../../lib/paths';
import { useTraducir } from '../../hooks/useTraducir';
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

function esTextoPlano(valor) {
  return typeof valor === 'string' || typeof valor === 'number';
}

const SiteNavLink = ({ enlace, className, activeProps, children, onClick }) => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const childrenEsCustom = children != null && !esTextoPlano(children);
  const etiquetaBase = String(
    (esTextoPlano(children) ? children : null)
      ?? enlace?.etiqueta
      ?? enlace?.Etiqueta
      ?? '',
  );
  const etiqueta = useTraducir(etiquetaBase);
  const ruta = enlace?.ruta;
  const homeSection = resolveHomeSectionFromRoute(ruta);
  const currentPath = normalizePathname(pathname);
  const targetPath = normalizePathname(String(ruta || '').split('#')[0] || '/');
  const esCatalogo =
    currentPath === '/productos' || currentPath.startsWith('/productos/');
  const enlaceEsProductos =
    homeSection === 'productos' ||
    targetPath === '/productos' ||
    String(ruta || '').toLowerCase().includes('productos');
  const isCurrent =
    (esCatalogo && enlaceEsProductos) ||
    (!homeSection && Boolean(targetPath) && currentPath === targetPath && targetPath !== '/');

  if (!ruta) {
    return null;
  }

  const contenido = childrenEsCustom ? children : etiqueta;

  if (esRutaExterna(ruta)) {
    return (
      <a
        href={ruta}
        className={className}
        onClick={onClick}
        target={enlace.abrirEnNuevaPestana ? '_blank' : undefined}
        rel={enlace.abrirEnNuevaPestana ? 'noreferrer' : undefined}
      >
        {contenido}
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
      className={[className, isCurrent ? 'is-current' : ''].filter(Boolean).join(' ')}
      activeOptions={{ exact: Boolean(homeSection) || normalizePathname(ruta) === '/' }}
      activeProps={activeProps}
      onClick={handleClick}
    >
      {contenido}
    </Link>
  );
};

export default SiteNavLink;
