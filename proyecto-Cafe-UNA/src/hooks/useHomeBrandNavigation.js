import { useCallback } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { goToHomeHero } from '../lib/homeScrollTarget';
import { leaveAdminTabToSiteHome } from '../lib/siteWindows';

export function useHomeBrandNavigation() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const onBrandClick = useCallback((event) => {
    event.preventDefault();
    const enAdmin = String(pathname || '').startsWith('/admin');
    if (enAdmin) {
      leaveAdminTabToSiteHome({
        navigate,
        pathname,
        goHomeInPlace: goToHomeHero,
      });
      return;
    }
    goToHomeHero(navigate, pathname);
  }, [navigate, pathname]);

  return onBrandClick;
}
