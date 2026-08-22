import { useCallback } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { goToHomeHero } from '../lib/homeScrollTarget';

export function useHomeBrandNavigation() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const onBrandClick = useCallback((event) => {
    event.preventDefault();
    goToHomeHero(navigate, pathname);
  }, [navigate, pathname]);

  return onBrandClick;
}
