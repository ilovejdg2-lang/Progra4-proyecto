import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { isRouteLoadingLocked } from '../../lib/routeLoadingLock';
import BrandLoader from './BrandLoader';

let activeLoaders = 0;
let pendingRemoveFrame = null;

function addGlobalLoading() {
  if (pendingRemoveFrame !== null) {
    cancelAnimationFrame(pendingRemoveFrame);
    pendingRemoveFrame = null;
  }
  activeLoaders += 1;
  document.body.classList.add('app-route-loading');
}

function removeGlobalLoading() {
  activeLoaders = Math.max(activeLoaders - 1, 0);
  if (activeLoaders > 0) return;
  // Si la ruta sigue bloqueada, el lock mantiene el overlay.
  if (isRouteLoadingLocked()) return;

  if (pendingRemoveFrame !== null) {
    cancelAnimationFrame(pendingRemoveFrame);
  }

  pendingRemoveFrame = requestAnimationFrame(() => {
    pendingRemoveFrame = null;
    if (activeLoaders === 0 && !isRouteLoadingLocked()) {
      document.body.classList.remove('app-route-loading');
    }
  });
}

const PageLoading = ({
  message = 'Cargando p\u00e1gina...',
  detail = '',
  isError = false,
  onRetry,
  retryLabel = 'Reintentar',
  variant = 'default',
}) => {
  // Durante el render: asegurar clase antes del paint (sin quitar el boot HTML).
  if (typeof document !== 'undefined' && variant !== 'hero') {
    document.body.classList.add('app-route-loading');
  }

  useLayoutEffect(() => {
    if (variant === 'hero') {
      document.body.classList.add('app-route-loading-hero');
      return () => {
        document.body.classList.remove('app-route-loading-hero');
      };
    }

    addGlobalLoading();

    return () => {
      removeGlobalLoading();
    };
  }, [variant]);

  const tone = variant === 'hero' ? 'hero' : 'site';

  const content = (
    <div
      className={`page-loading page-loading--${variant} ${isError ? 'page-loading--error' : ''}`}
      role="status"
      aria-live="polite"
    >
      <BrandLoader
        message={message}
        detail={detail}
        tone={tone}
        showSpinner={!isError}
      >
        {isError && onRetry ? (
          <button type="button" className="page-loading__retry" onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
      </BrandLoader>
    </div>
  );

  if (variant === 'hero') {
    return content;
  }

  return createPortal(content, document.body);
};

export default PageLoading;
