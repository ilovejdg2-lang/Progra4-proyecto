import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { removeSiteBootLoading } from '../../lib/siteBootLoading';

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

  if (pendingRemoveFrame !== null) {
    cancelAnimationFrame(pendingRemoveFrame);
  }

  pendingRemoveFrame = requestAnimationFrame(() => {
    pendingRemoveFrame = null;
    if (activeLoaders === 0) {
      document.body.classList.remove('app-route-loading');
    }
  });
}

const PageLoading = ({
  message = 'Cargando página...',
  detail = '',
  isError = false,
  onRetry,
  retryLabel = 'Reintentar',
  variant = 'default',
}) => {
  useLayoutEffect(() => {
    if (variant === 'hero') {
      removeSiteBootLoading();
      document.body.classList.add('app-route-loading-hero');
      return () => {
        document.body.classList.remove('app-route-loading-hero');
      };
    }

    addGlobalLoading();
    removeSiteBootLoading();

    return () => {
      removeGlobalLoading();
    };
  }, [variant]);

  const content = (
    <div
      className={`page-loading page-loading--${variant} ${isError ? 'page-loading--error' : ''}`}
      role="status"
      aria-live="polite"
    >
      {isError ? null : <span className="page-loading__spinner" aria-hidden="true" />}
      <p>{message}</p>
      {detail ? <span className="page-loading__detail">{detail}</span> : null}
      {isError && onRetry ? (
        <button type="button" className="page-loading__retry" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );

  if (variant === 'hero') {
    return content;
  }

  return createPortal(content, document.body);
};

export default PageLoading;
