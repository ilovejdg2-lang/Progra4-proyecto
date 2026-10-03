import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import { normalizarEquipo } from '../../lib/aboutPageData';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import { obtenerEquipo } from '../../services/informacionService';
import { EquipoSection } from './EquipoSection';
import './AboutUs.css';

async function fetchEquipoPage() {
  return { equipo: normalizarEquipo(await obtenerEquipo()) };
}

const Equipo = () => {
  const { data, showLoading, isError, error, reload, loadingMessage } = useCachedPublicPage(
    'equipo',
    fetchEquipoPage,
  );

  useRevealOnScroll(!showLoading && !isError, '.about-page');

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={isError}
      error={error}
      errorMessage="No se pudo cargar el equipo."
      onRetry={reload}
    >
      <main className="about-page site-canvas">
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.about} />
        <EquipoSection equipo={data?.equipo} />
      </main>
    </PublicPageGate>
  );
};

export default Equipo;
