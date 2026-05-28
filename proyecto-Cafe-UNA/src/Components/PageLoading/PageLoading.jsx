import { useLayoutEffect } from 'react';

let activeLoaders = 0;

function addGlobalLoading() {
  activeLoaders += 1;
  document.body.classList.add('app-route-loading');
}

function removeGlobalLoading() {
  activeLoaders = Math.max(activeLoaders - 1, 0);
  if (activeLoaders === 0) {
    document.body.classList.remove('app-route-loading');
  }
}

const PageLoading = ({ message = 'Cargando página...' }) => {
  useLayoutEffect(() => {
    addGlobalLoading();

    return () => {
      removeGlobalLoading();
    };
  }, []);

  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
};

export default PageLoading;
