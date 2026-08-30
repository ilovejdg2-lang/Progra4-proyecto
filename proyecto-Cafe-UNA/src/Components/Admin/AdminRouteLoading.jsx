import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { isRouteLoadingLocked } from '../../lib/routeLoadingLock';
import BrandLoader from '../PageLoading/BrandLoader';

let activeAdminLoaders = 0;

function addAdminRouteLoading() {
  activeAdminLoaders += 1;
  document.body.classList.add('admin-route-loading-active');
}

function removeAdminRouteLoading() {
  activeAdminLoaders = Math.max(activeAdminLoaders - 1, 0);
  if (activeAdminLoaders > 0) return;
  if (isRouteLoadingLocked()) return;
  document.body.classList.remove('admin-route-loading-active');
}

const AdminRouteLoading = ({ message = 'Cargando panel administrativo...' }) => {
  if (typeof document !== 'undefined') {
    document.body.classList.add('admin-route-loading-active');
  }

  useLayoutEffect(() => {
    addAdminRouteLoading();

    return () => {
      removeAdminRouteLoading();
    };
  }, []);

  return createPortal(
    <div className="admin-route-loading admin-route-loading--overlay" role="status" aria-live="polite">
      <BrandLoader message={message} tone="admin" />
    </div>,
    document.body,
  );
};

export default AdminRouteLoading;
