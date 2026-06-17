import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { finishAdminBootLoading, removeAdminBootLoading } from '../../lib/siteBootLoading';

let activeAdminLoaders = 0;

function addAdminRouteLoading() {
  activeAdminLoaders += 1;
  document.body.classList.add('admin-route-loading-active');
}

function removeAdminRouteLoading() {
  activeAdminLoaders = Math.max(activeAdminLoaders - 1, 0);
  if (activeAdminLoaders === 0) {
    document.body.classList.remove('admin-route-loading-active');
  }
}

const AdminRouteLoading = ({ message = 'Cargando panel administrativo...' }) => {
  useLayoutEffect(() => {
    removeAdminBootLoading();
    addAdminRouteLoading();

    return () => {
      removeAdminRouteLoading();
    };
  }, []);

  return createPortal(
    <div className="admin-route-loading admin-route-loading--overlay" role="status" aria-live="polite">
      <span className="admin-route-loading__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>,
    document.body,
  );
};

export default AdminRouteLoading;
